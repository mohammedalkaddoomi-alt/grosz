
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const message = typeof body?.message === 'string' ? body.message.trim() : ''
        if (!message) {
            return new Response(JSON.stringify({ error: 'Message is required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // 1. Authenticate user
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        // 2. Fetch User Financial Data (Last 30 Days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const [{ data: ownedWallets, error: ownedWalletsError }, { data: memberWallets, error: memberWalletsError }] = await Promise.all([
            supabaseClient
                .from('wallets')
                .select('id')
                .eq('owner_id', user.id),
            supabaseClient
                .from('wallet_members')
                .select('wallet_id')
                .eq('user_id', user.id),
        ])

        if (ownedWalletsError) throw ownedWalletsError
        if (memberWalletsError) throw memberWalletsError

        const walletIds = Array.from(new Set([
            ...(ownedWallets || []).map(w => w.id),
            ...(memberWallets || []).map(w => w.wallet_id),
        ]))

        const transactionsPromise = walletIds.length > 0
            ? supabaseClient
                .from('transactions')
                .select('amount, type, categories(name, emoji), description, date, created_at')
                .in('wallet_id', walletIds)
                .gte('date', thirtyDaysAgo.toISOString())
                .order('date', { ascending: false })
            : Promise.resolve({ data: [], error: null })

        const goalsPromise = walletIds.length > 0
            ? supabaseClient
                .from('goals')
                .select('name, target_amount, current_amount, wallet_id, user_id, users(name)')
                .or(`user_id.eq.${user.id},wallet_id.in.(${walletIds.join(',')})`)
                .order('created_at', { ascending: false })
            : supabaseClient
                .from('goals')
                .select('name, target_amount, current_amount, wallet_id, user_id, users(name)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

        const goalActivitiesPromise = walletIds.length > 0
            ? supabaseClient
                .from('goal_activities')
                .select('action, amount, created_at, users(name), goals(name, wallet_id)')
                .order('created_at', { ascending: false })
                .limit(20)
            : Promise.resolve({ data: [], error: null })

        const [transactions, subscriptions, goals, goalActivities, wageSettings] = await Promise.all([
            transactionsPromise,
            supabaseClient
                .from('subscriptions')
                .select('name, price, currency, billing_cycle')
                .eq('user_id', user.id),
            goalsPromise,
            goalActivitiesPromise,
            supabaseClient
                .from('user_settings')
                .select('wage_amount, wage_period, currency')
                .eq('user_id', user.id)
                .single(),
        ])

        if (transactions.error) throw transactions.error
        if (subscriptions.error) throw subscriptions.error
        if (goals.error) throw goals.error
        if (goalActivities.error && goalActivities.error.code !== '42P01' && goalActivities.error.code !== 'PGRST205') {
            throw goalActivities.error
        }
        if (wageSettings.error && wageSettings.error.code !== 'PGRST116') throw wageSettings.error

        // 3. Construct Context for AI
        const financialContext = {
            user_name: user.user_metadata?.name || 'User',
            recent_transactions: transactions.data || [],
            active_subscriptions: subscriptions.data || [],
            savings_goals: goals.data || [],
            goal_activity: goalActivities.data || [],
            wage_settings: wageSettings.data || null,
            currency: wageSettings.data?.currency || 'PLN'
        }

        // 4. Call Gemini 1.5 Flash API
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        let aiResponse = "Przepraszam, asystent AI jest chwilowo niedostępny. Spróbuj ponownie za moment. 🙏"

        const systemPrompt = `
      You are 'Cenny Grosz', an expert personal financial advisor AI.
      
      STRICT RULES:
      1. You must ONLY answer questions related to the user's finances, budgeting, saving, or investing.
      2. If the user asks about anything else (e.g., politics, coding, general knowledge), politely refuse and steer back to finances.
      3. Use the provided JSON data to give specific, personalized answers.
      4. Be encouraging, concise, and use emojis.
      5. Speak in Polish (Polski).
      
      USER FINANCIAL DATA:
      ${JSON.stringify(financialContext)}
    `

        if (GEMINI_API_KEY) {
            try {
                const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`
                const response = await fetch(GEMINI_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            {
                                role: 'user',
                                parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }]
                            }
                        ],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 500,
                        }
                    })
                })

                const data = await response.json()
                if (!response.ok) {
                    console.error('Gemini API Error:', data)
                } else {
                    aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || aiResponse
                }
            } catch (error) {
                console.error('Gemini request failed:', error)
            }
        } else {
            console.error('GEMINI_API_KEY is missing')
        }

        // Save chat history (best effort)
        const { error: insertError } = await supabaseClient
            .from('chat_history')
            .insert({
                user_id: user.id,
                message,
                response: aiResponse,
            })
        if (insertError) {
            console.error('Failed to save chat history:', insertError)
        }

        return new Response(JSON.stringify({ response: aiResponse, timestamp: new Date().toISOString() }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
