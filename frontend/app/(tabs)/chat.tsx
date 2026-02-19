import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { Colors, Gradients, Shadows, BorderRadius, Spacing } from '../../src/constants/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const listRef = useRef<FlatList<Message>>(null);

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await api.getChatHistory(30);
      const ordered = [...(history || [])].reverse();
      const restoredMessages: Message[] = ordered.flatMap((item: any) => {
        const items: Message[] = [];
        if (item?.message?.trim()) {
          items.push({
            id: `${item.id}-user`,
            role: 'user',
            content: item.message,
          });
        }
        if (item?.response?.trim()) {
          items.push({
            id: `${item.id}-assistant`,
            role: 'assistant',
            content: item.response,
          });
        }
        return items;
      });
      setMessages(restoredMessages);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setLoadingHistory(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    // Optimistic update
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    scrollToBottom();

    // Create placeholder for AI response
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: '...' // Initial loading state
    };
    setMessages((prev) => [...prev, aiMsg]);

    try {
      let isFirstChunk = true;

      await api.chatStream(userMsg.content, (chunk) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          // If this is the very first chunk, replace "..." with the chunk
          // If not, append
          if (last.id === aiMsgId) {
            const newContent = isFirstChunk ? chunk : last.content + chunk;
            isFirstChunk = false;
            return [...prev.slice(0, -1), { ...last, content: newContent }];
          }
          return prev;
        });
        scrollToBottom();
      });

    } catch (e) {
      console.error(e);
      const fallback = 'Asystent AI jest chwilowo niedostępny. Sprawdź połączenie i spróbuj ponownie za chwilę.';
      setMessages((prev) => {
        // Replace the "..." or partial response with fallback if it failed completely? 
        // Or just append error? 
        // Most user friendly: if we got SOME content, keep it and add error.
        // But for simplicity, if it fails, we usually just show error.
        // Let's replace the last message if it's the AI placeholder
        const last = prev[prev.length - 1];
        if (last.id === aiMsgId) {
          return [...prev.slice(0, -1), { ...last, content: fallback }];
        }
        return [...prev, { id: 'error-' + Date.now(), role: 'assistant', content: fallback }];
      });

      // Fallback save to history if we want (but api.chatStream handles success save)
      // If it failed, we probably don't want to save partial garbage.
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const clearMessages = () => {
    if (messages.length === 0) return;
    Alert.alert(
      'Wyczyścić czat?',
      'Ta operacja usunie bieżący widok rozmowy.',
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Wyczyść', style: 'destructive', onPress: () => setMessages([]) },
      ],
    );
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.msgRow, item.role === 'user' && styles.msgRowUser]}>
      {item.role === 'assistant' && (
        <LinearGradient colors={Gradients.primary} style={styles.avatar}>
          <Ionicons name="sparkles" size={16} color={Colors.white} />
        </LinearGradient>
      )}
      <View style={[styles.msgBubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.msgText, item.role === 'user' && styles.userText]}>{item.content}</Text>
      </View>
    </View>
  );

  const suggestions = [
    { icon: '💡', text: 'Jak oszczędzać pieniądze?' },
    { icon: '📊', text: 'Przeanalizuj moje wydatki' },
    { icon: '📈', text: 'Podsumowanie finansów' },
    { icon: '🎯', text: 'Pomóż mi z celami' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <LinearGradient colors={Gradients.primary} style={styles.headerIcon}>
            <Ionicons name="sparkles" size={18} color={Colors.white} />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>Asystent AI</Text>
            <Text style={styles.headerSubtitle}>Twój doradca finansowy</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.clearBtn, messages.length === 0 && styles.clearBtnDisabled]}
          onPress={clearMessages}
          disabled={messages.length === 0}
        >
          <Ionicons name="refresh" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loadingHistory ? (
          <View style={styles.loadingHistory}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingHistoryText}>Ładowanie rozmów...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.welcome}>
            <LinearGradient colors={Gradients.primary} style={styles.welcomeIcon}>
              <Ionicons name="sparkles" size={40} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.welcomeTitle}>Cześć! 👋</Text>
            <Text style={styles.welcomeText}>Jestem Cenny Grosz - Twój osobisty asystent finansowy. Zapytaj mnie o porady, analizę wydatków lub pomoc w planowaniu budżetu.</Text>

            <View style={styles.suggestions}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionBtn}
                  onPress={() => setInput(s.text)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionIcon}>{s.icon}</Text>
                  <Text style={styles.suggestionText}>{s.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {loading && (
          <View style={styles.typing}>
            <View style={styles.typingDots}>
              <View style={[styles.typingDot, styles.typingDot1]} />
              <View style={[styles.typingDot, styles.typingDot2]} />
              <View style={[styles.typingDot, styles.typingDot3]} />
            </View>
            <Text style={styles.typingText}>Myślę...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Zadaj pytanie..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!input.trim() || loading}
            >
              <LinearGradient
                colors={input.trim() && !loading ? Gradients.primary : [Colors.border, Colors.border]}
                style={styles.sendGradient}
              >
                <Ionicons name="send" size={18} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.card,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: Spacing.md },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  headerSubtitle: { fontSize: 12, color: Colors.textLight, marginTop: 1 },
  clearBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnDisabled: {
    opacity: 0.4,
  },
  loadingHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingHistoryText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  welcome: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxl },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  welcomeTitle: { fontSize: 28, fontWeight: '700', color: Colors.text },
  welcomeText: {
    fontSize: 15,
    color: Colors.textLight,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  suggestions: { gap: Spacing.sm, width: '100%' },
  suggestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    ...Shadows.small,
  },
  suggestionIcon: { fontSize: 20 },
  suggestionText: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  msgList: { padding: Spacing.xl, paddingBottom: Spacing.md },
  msgRow: { flexDirection: 'row', marginBottom: Spacing.md, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    ...Shadows.small,
  },
  msgBubble: { maxWidth: '75%', padding: Spacing.lg, borderRadius: BorderRadius.xl },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
    ...Shadows.small,
  },
  aiBubble: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
    ...Shadows.small,
  },
  msgText: { fontSize: 15, color: Colors.text, lineHeight: 22 },
  userText: { color: Colors.white },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  typingDots: { flexDirection: 'row', gap: 4 },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    opacity: 0.4,
  },
  typingDot1: { opacity: 0.4 },
  typingDot2: { opacity: 0.6 },
  typingDot3: { opacity: 0.8 },
  typingText: { fontSize: 14, color: Colors.textLight },
  inputContainer: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 120,
    minHeight: 44,
  },
  sendBtn: { borderRadius: BorderRadius.full, overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.5 },
  sendGradient: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
});
