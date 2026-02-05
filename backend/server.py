from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret_key')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="Cenny Grosz API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ================== MODELS ==================

# User Models
class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Wallet Models
class WalletCreate(BaseModel):
    name: str
    emoji: str = "💰"
    is_shared: bool = False

class WalletResponse(BaseModel):
    id: str
    name: str
    emoji: str
    balance: float
    is_shared: bool
    owner_id: str
    members: List[str] = []
    created_at: datetime

class WalletUpdate(BaseModel):
    name: Optional[str] = None
    emoji: Optional[str] = None

# Transaction Models
class TransactionCreate(BaseModel):
    wallet_id: str
    amount: float
    type: str  # "income" or "expense"
    category: str
    emoji: str = "💵"
    note: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    wallet_id: str
    user_id: str
    amount: float
    type: str
    category: str
    emoji: str
    note: Optional[str] = None
    created_at: datetime

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    emoji: Optional[str] = None
    note: Optional[str] = None

# Category Models
class CategoryCreate(BaseModel):
    name: str
    emoji: str
    type: str  # "income" or "expense"

class CategoryResponse(BaseModel):
    id: str
    user_id: str
    name: str
    emoji: str
    type: str

# Goal Models
class GoalCreate(BaseModel):
    name: str
    target_amount: float
    emoji: str = "🎯"
    deadline: Optional[datetime] = None

class GoalResponse(BaseModel):
    id: str
    user_id: str
    name: str
    target_amount: float
    current_amount: float
    emoji: str
    deadline: Optional[datetime] = None
    completed: bool
    created_at: datetime

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    emoji: Optional[str] = None
    deadline: Optional[datetime] = None

class GoalContribute(BaseModel):
    amount: float

# AI Chat Models
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    timestamp: datetime

# ================== AUTH HELPERS ==================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Brak autoryzacji")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="Użytkownik nie znaleziony")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token wygasł")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Nieprawidłowy token")

# ================== AUTH ROUTES ==================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Użytkownik z tym emailem już istnieje")
    
    # Create user
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email.lower(),
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(user)
    
    # Create default personal wallet
    wallet = {
        "id": str(uuid.uuid4()),
        "name": "Mój portfel",
        "emoji": "💰",
        "balance": 0.0,
        "is_shared": False,
        "owner_id": user_id,
        "members": [],
        "created_at": datetime.utcnow()
    }
    await db.wallets.insert_one(wallet)
    
    token = create_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Nieprawidłowy email lub hasło")
    
    token = create_token(user["id"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        created_at=current_user["created_at"]
    )

# ================== WALLET ROUTES ==================

@api_router.post("/wallets", response_model=WalletResponse)
async def create_wallet(wallet_data: WalletCreate, current_user: dict = Depends(get_current_user)):
    wallet = {
        "id": str(uuid.uuid4()),
        "name": wallet_data.name,
        "emoji": wallet_data.emoji,
        "balance": 0.0,
        "is_shared": wallet_data.is_shared,
        "owner_id": current_user["id"],
        "members": [current_user["id"]] if wallet_data.is_shared else [],
        "created_at": datetime.utcnow()
    }
    await db.wallets.insert_one(wallet)
    return WalletResponse(**wallet)

@api_router.get("/wallets", response_model=List[WalletResponse])
async def get_wallets(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    wallets = await db.wallets.find({
        "$or": [
            {"owner_id": user_id},
            {"members": user_id}
        ]
    }).to_list(100)
    return [WalletResponse(**w) for w in wallets]

@api_router.get("/wallets/{wallet_id}", response_model=WalletResponse)
async def get_wallet(wallet_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    wallet = await db.wallets.find_one({
        "id": wallet_id,
        "$or": [{"owner_id": user_id}, {"members": user_id}]
    })
    if not wallet:
        raise HTTPException(status_code=404, detail="Portfel nie znaleziony")
    return WalletResponse(**wallet)

@api_router.put("/wallets/{wallet_id}", response_model=WalletResponse)
async def update_wallet(wallet_id: str, update_data: WalletUpdate, current_user: dict = Depends(get_current_user)):
    wallet = await db.wallets.find_one({"id": wallet_id, "owner_id": current_user["id"]})
    if not wallet:
        raise HTTPException(status_code=404, detail="Portfel nie znaleziony")
    
    updates = {k: v for k, v in update_data.dict().items() if v is not None}
    if updates:
        await db.wallets.update_one({"id": wallet_id}, {"$set": updates})
        wallet.update(updates)
    
    return WalletResponse(**wallet)

@api_router.delete("/wallets/{wallet_id}")
async def delete_wallet(wallet_id: str, current_user: dict = Depends(get_current_user)):
    wallet = await db.wallets.find_one({"id": wallet_id, "owner_id": current_user["id"]})
    if not wallet:
        raise HTTPException(status_code=404, detail="Portfel nie znaleziony")
    
    await db.wallets.delete_one({"id": wallet_id})
    await db.transactions.delete_many({"wallet_id": wallet_id})
    return {"message": "Portfel usunięty"}

# ================== TRANSACTION ROUTES ==================

@api_router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(tx_data: TransactionCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # Verify wallet access
    wallet = await db.wallets.find_one({
        "id": tx_data.wallet_id,
        "$or": [{"owner_id": user_id}, {"members": user_id}]
    })
    if not wallet:
        raise HTTPException(status_code=404, detail="Portfel nie znaleziony")
    
    # Validate transaction type
    if tx_data.type not in ["income", "expense"]:
        raise HTTPException(status_code=400, detail="Typ transakcji musi być 'income' lub 'expense'")
    
    # Create transaction
    transaction = {
        "id": str(uuid.uuid4()),
        "wallet_id": tx_data.wallet_id,
        "user_id": user_id,
        "amount": abs(tx_data.amount),
        "type": tx_data.type,
        "category": tx_data.category,
        "emoji": tx_data.emoji,
        "note": tx_data.note,
        "created_at": datetime.utcnow()
    }
    await db.transactions.insert_one(transaction)
    
    # Update wallet balance
    balance_change = transaction["amount"] if tx_data.type == "income" else -transaction["amount"]
    await db.wallets.update_one(
        {"id": tx_data.wallet_id},
        {"$inc": {"balance": balance_change}}
    )
    
    return TransactionResponse(**transaction)

@api_router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    wallet_id: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    
    # Get user's wallets
    wallets = await db.wallets.find({
        "$or": [{"owner_id": user_id}, {"members": user_id}]
    }).to_list(100)
    wallet_ids = [w["id"] for w in wallets]
    
    query = {"wallet_id": {"$in": wallet_ids}}
    if wallet_id:
        if wallet_id not in wallet_ids:
            raise HTTPException(status_code=403, detail="Brak dostępu do tego portfela")
        query = {"wallet_id": wallet_id}
    
    transactions = await db.transactions.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [TransactionResponse(**tx) for tx in transactions]

@api_router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: str, current_user: dict = Depends(get_current_user)):
    transaction = await db.transactions.find_one({"id": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transakcja nie znaleziona")
    
    # Verify access
    wallet = await db.wallets.find_one({
        "id": transaction["wallet_id"],
        "$or": [{"owner_id": current_user["id"]}, {"members": current_user["id"]}]
    })
    if not wallet:
        raise HTTPException(status_code=403, detail="Brak dostępu do tej transakcji")
    
    return TransactionResponse(**transaction)

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, current_user: dict = Depends(get_current_user)):
    transaction = await db.transactions.find_one({"id": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transakcja nie znaleziona")
    
    # Verify ownership or wallet access
    wallet = await db.wallets.find_one({
        "id": transaction["wallet_id"],
        "$or": [{"owner_id": current_user["id"]}, {"members": current_user["id"]}]
    })
    if not wallet:
        raise HTTPException(status_code=403, detail="Brak dostępu do tej transakcji")
    
    # Reverse balance change
    balance_change = -transaction["amount"] if transaction["type"] == "income" else transaction["amount"]
    await db.wallets.update_one(
        {"id": transaction["wallet_id"]},
        {"$inc": {"balance": balance_change}}
    )
    
    await db.transactions.delete_one({"id": transaction_id})
    return {"message": "Transakcja usunięta"}

# ================== CATEGORY ROUTES ==================

# Default categories
DEFAULT_EXPENSE_CATEGORIES = [
    {"name": "Jedzenie", "emoji": "🍔"},
    {"name": "Transport", "emoji": "🚗"},
    {"name": "Zakupy", "emoji": "🛒"},
    {"name": "Rozrywka", "emoji": "🎬"},
    {"name": "Rachunki", "emoji": "📄"},
    {"name": "Zdrowie", "emoji": "💊"},
    {"name": "Inne", "emoji": "📌"},
]

DEFAULT_INCOME_CATEGORIES = [
    {"name": "Wynagrodzenie", "emoji": "💰"},
    {"name": "Freelance", "emoji": "💻"},
    {"name": "Prezent", "emoji": "🎁"},
    {"name": "Zwrot", "emoji": "↩️"},
    {"name": "Inwestycje", "emoji": "📈"},
    {"name": "Inne", "emoji": "💵"},
]

@api_router.get("/categories")
async def get_categories(type: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get user's categories + default ones"""
    user_id = current_user["id"]
    
    # Get user's custom categories
    query = {"user_id": user_id}
    if type:
        query["type"] = type
    
    custom_categories = await db.categories.find(query).to_list(100)
    
    # Prepare response with defaults + custom
    if type == "expense":
        defaults = [{"id": f"default-expense-{i}", "name": c["name"], "emoji": c["emoji"], "type": "expense", "is_default": True} for i, c in enumerate(DEFAULT_EXPENSE_CATEGORIES)]
    elif type == "income":
        defaults = [{"id": f"default-income-{i}", "name": c["name"], "emoji": c["emoji"], "type": "income", "is_default": True} for i, c in enumerate(DEFAULT_INCOME_CATEGORIES)]
    else:
        defaults = [{"id": f"default-expense-{i}", "name": c["name"], "emoji": c["emoji"], "type": "expense", "is_default": True} for i, c in enumerate(DEFAULT_EXPENSE_CATEGORIES)]
        defaults += [{"id": f"default-income-{i}", "name": c["name"], "emoji": c["emoji"], "type": "income", "is_default": True} for i, c in enumerate(DEFAULT_INCOME_CATEGORIES)]
    
    custom = [{"id": c["id"], "name": c["name"], "emoji": c["emoji"], "type": c["type"], "is_default": False} for c in custom_categories]
    
    return defaults + custom

@api_router.post("/categories")
async def create_category(category_data: CategoryCreate, current_user: dict = Depends(get_current_user)):
    """Create a custom category"""
    if category_data.type not in ["income", "expense"]:
        raise HTTPException(status_code=400, detail="Typ musi być 'income' lub 'expense'")
    
    category = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "name": category_data.name,
        "emoji": category_data.emoji,
        "type": category_data.type,
        "created_at": datetime.utcnow()
    }
    await db.categories.insert_one(category)
    return {"id": category["id"], "name": category["name"], "emoji": category["emoji"], "type": category["type"], "is_default": False}

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a custom category"""
    category = await db.categories.find_one({"id": category_id, "user_id": current_user["id"]})
    if not category:
        raise HTTPException(status_code=404, detail="Kategoria nie znaleziona")
    
    await db.categories.delete_one({"id": category_id})
    return {"message": "Kategoria usunięta"}

# ================== GOAL ROUTES ==================

@api_router.post("/goals", response_model=GoalResponse)
async def create_goal(goal_data: GoalCreate, current_user: dict = Depends(get_current_user)):
    goal = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "name": goal_data.name,
        "target_amount": goal_data.target_amount,
        "current_amount": 0.0,
        "emoji": goal_data.emoji,
        "deadline": goal_data.deadline,
        "completed": False,
        "created_at": datetime.utcnow()
    }
    await db.goals.insert_one(goal)
    return GoalResponse(**goal)

@api_router.get("/goals", response_model=List[GoalResponse])
async def get_goals(current_user: dict = Depends(get_current_user)):
    goals = await db.goals.find({"user_id": current_user["id"]}).to_list(100)
    return [GoalResponse(**g) for g in goals]

@api_router.get("/goals/{goal_id}", response_model=GoalResponse)
async def get_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    goal = await db.goals.find_one({"id": goal_id, "user_id": current_user["id"]})
    if not goal:
        raise HTTPException(status_code=404, detail="Cel nie znaleziony")
    return GoalResponse(**goal)

@api_router.put("/goals/{goal_id}", response_model=GoalResponse)
async def update_goal(goal_id: str, update_data: GoalUpdate, current_user: dict = Depends(get_current_user)):
    goal = await db.goals.find_one({"id": goal_id, "user_id": current_user["id"]})
    if not goal:
        raise HTTPException(status_code=404, detail="Cel nie znaleziony")
    
    updates = {k: v for k, v in update_data.dict().items() if v is not None}
    
    # Check if goal is completed
    if "current_amount" in updates or "target_amount" in updates:
        current = updates.get("current_amount", goal["current_amount"])
        target = updates.get("target_amount", goal["target_amount"])
        updates["completed"] = current >= target
    
    if updates:
        await db.goals.update_one({"id": goal_id}, {"$set": updates})
        goal.update(updates)
    
    return GoalResponse(**goal)

@api_router.post("/goals/{goal_id}/contribute", response_model=GoalResponse)
async def contribute_to_goal(goal_id: str, contribution: GoalContribute, current_user: dict = Depends(get_current_user)):
    goal = await db.goals.find_one({"id": goal_id, "user_id": current_user["id"]})
    if not goal:
        raise HTTPException(status_code=404, detail="Cel nie znaleziony")
    
    new_amount = goal["current_amount"] + contribution.amount
    completed = new_amount >= goal["target_amount"]
    
    await db.goals.update_one(
        {"id": goal_id},
        {"$set": {"current_amount": new_amount, "completed": completed}}
    )
    
    goal["current_amount"] = new_amount
    goal["completed"] = completed
    return GoalResponse(**goal)

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    goal = await db.goals.find_one({"id": goal_id, "user_id": current_user["id"]})
    if not goal:
        raise HTTPException(status_code=404, detail="Cel nie znaleziony")
    
    await db.goals.delete_one({"id": goal_id})
    return {"message": "Cel usunięty"}

# ================== AI ASSISTANT ROUTES ==================

@api_router.post("/ai/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Get user's financial data for context
        user_id = current_user["id"]
        
        wallets = await db.wallets.find({
            "$or": [{"owner_id": user_id}, {"members": user_id}]
        }).to_list(100)
        
        total_balance = sum(w["balance"] for w in wallets)
        
        recent_transactions = await db.transactions.find({
            "wallet_id": {"$in": [w["id"] for w in wallets]}
        }).sort("created_at", -1).limit(20).to_list(20)
        
        goals = await db.goals.find({"user_id": user_id}).to_list(100)
        
        # Build financial context
        tx_summary = ""
        if recent_transactions:
            income_total = sum(tx["amount"] for tx in recent_transactions if tx["type"] == "income")
            expense_total = sum(tx["amount"] for tx in recent_transactions if tx["type"] == "expense")
            categories = {}
            for tx in recent_transactions:
                if tx["type"] == "expense":
                    cat = tx["category"]
                    categories[cat] = categories.get(cat, 0) + tx["amount"]
            
            top_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5]
            tx_summary = f"""
Ostatnie transakcje (20):
- Suma przychodów: {income_total:.2f} PLN
- Suma wydatków: {expense_total:.2f} PLN
- Top kategorie wydatków: {', '.join([f'{c}: {a:.2f} PLN' for c, a in top_categories])}
"""
        
        goals_summary = ""
        if goals:
            goals_list = [f"- {g['emoji']} {g['name']}: {g['current_amount']:.2f}/{g['target_amount']:.2f} PLN ({int(g['current_amount']/g['target_amount']*100) if g['target_amount'] > 0 else 0}%)" for g in goals]
            goals_summary = "\nCele oszczędnościowe:\n" + "\n".join(goals_list)
        
        system_message = f"""Jesteś Cenny Grosz - przyjaznym i profesjonalnym asystentem finansowym po polsku.

Twoja osobowość:
- Przyjazny i wspierający, ale profesjonalny
- Zachęcający, ale nie dziecinny
- Mądry doradca finansowy
- Pomagasz w planowaniu budżetu i oszczędnościach

Dane finansowe użytkownika {current_user['name']}:
- Liczba portfeli: {len(wallets)}
- Całkowite saldo: {total_balance:.2f} PLN
{tx_summary}
{goals_summary}

Odpowiadaj zawsze po polsku. Bądź pomocny i konkretny. Dawaj praktyczne porady finansowe.
Używaj emoji by być przyjaznym, ale nie przesadzaj."""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"cenny_grosz_{user_id}",
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        # Save chat history
        await db.ai_chats.insert_one({
            "user_id": user_id,
            "user_message": request.message,
            "ai_response": response,
            "timestamp": datetime.utcnow()
        })
        
        return ChatResponse(response=response, timestamp=datetime.utcnow())
        
    except Exception as e:
        logger.error(f"AI Chat error: {str(e)}")
        return ChatResponse(
            response="Przepraszam, wystąpił problem z połączeniem. Spróbuj ponownie później. 🙏",
            timestamp=datetime.utcnow()
        )

@api_router.get("/ai/history", response_model=List[dict])
async def get_chat_history(limit: int = 20, current_user: dict = Depends(get_current_user)):
    chats = await db.ai_chats.find(
        {"user_id": current_user["id"]}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return [
        {
            "user_message": c["user_message"],
            "ai_response": c["ai_response"],
            "timestamp": c["timestamp"]
        }
        for c in reversed(chats)
    ]

# ================== DASHBOARD STATS ==================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    wallets = await db.wallets.find({
        "$or": [{"owner_id": user_id}, {"members": user_id}]
    }).to_list(100)
    
    wallet_ids = [w["id"] for w in wallets]
    total_balance = sum(w["balance"] for w in wallets)
    
    # Get this month's transactions
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    
    month_transactions = await db.transactions.find({
        "wallet_id": {"$in": wallet_ids},
        "created_at": {"$gte": month_start}
    }).to_list(1000)
    
    month_income = sum(tx["amount"] for tx in month_transactions if tx["type"] == "income")
    month_expenses = sum(tx["amount"] for tx in month_transactions if tx["type"] == "expense")
    
    # Get goals progress
    goals = await db.goals.find({"user_id": user_id}).to_list(100)
    goals_progress = []
    for g in goals:
        progress = (g["current_amount"] / g["target_amount"] * 100) if g["target_amount"] > 0 else 0
        goals_progress.append({
            "id": g["id"],
            "name": g["name"],
            "emoji": g["emoji"],
            "progress": min(progress, 100),
            "current": g["current_amount"],
            "target": g["target_amount"]
        })
    
    # Category breakdown
    categories = {}
    for tx in month_transactions:
        if tx["type"] == "expense":
            cat = tx["category"]
            categories[cat] = categories.get(cat, 0) + tx["amount"]
    
    return {
        "total_balance": total_balance,
        "month_income": month_income,
        "month_expenses": month_expenses,
        "wallets_count": len(wallets),
        "goals_progress": goals_progress,
        "expense_categories": categories
    }

# ================== MAIN ROUTES ==================

@api_router.get("/")
async def root():
    return {"message": "Witaj w Cenny Grosz API!", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
