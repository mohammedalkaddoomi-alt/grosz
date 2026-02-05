import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { COLORS, SPACING, BORDER_RADIUS, GRADIENTS } from '../../src/constants/theme';
import { PL } from '../../src/constants/polish';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { loadChatHistory(); }, []);

  const loadChatHistory = async () => {
    try {
      const history = await api.getChatHistory();
      const formattedMessages: Message[] = [];
      history.forEach((item: any) => {
        formattedMessages.push({ id: `user-${item.timestamp}`, role: 'user', content: item.user_message, timestamp: new Date(item.timestamp) });
        formattedMessages.push({ id: `ai-${item.timestamp}`, role: 'assistant', content: item.ai_response, timestamp: new Date(item.timestamp) });
      });
      setMessages(formattedMessages);
    } catch (error) { console.error('Error loading history:', error); }
    finally { setIsLoadingHistory(false); }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: inputText.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const response = await api.sendMessage(userMessage.content);
      const aiMessage: Message = { id: `ai-${Date.now()}`, role: 'assistant', content: response.response, timestamp: new Date(response.timestamp) };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      setMessages((prev) => [...prev, { id: `error-${Date.now()}`, role: 'assistant', content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie. 😔', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.aiMessageContainer]}>
        {!isUser && (
          <LinearGradient colors={GRADIENTS.primary} style={styles.avatar}>
            <Ionicons name="sparkles" size={16} color={COLORS.white} />
          </LinearGradient>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {isUser ? (
            <LinearGradient colors={GRADIENTS.primary} style={styles.userBubbleGradient}>
              <Text style={styles.userMessageText}>{item.content}</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.aiMessageText}>{item.content}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      <LinearGradient colors={GRADIENTS.primary} style={styles.welcomeIcon}>
        <Ionicons name="sparkles" size={40} color={COLORS.white} />
      </LinearGradient>
      <Text style={styles.welcomeTitle}>Cześć! Jestem Cenny Grosz 💰</Text>
      <Text style={styles.welcomeText}>Twój osobisty asystent finansowy. Jak mogę Ci pomóc?</Text>
      <View style={styles.suggestions}>
        <TouchableOpacity style={styles.suggestion} onPress={() => setInputText('Jak mogę oszczędzać więcej pieniędzy?')}>
          <LinearGradient colors={GRADIENTS.income} style={styles.suggestionIcon}>
            <Ionicons name="trending-up" size={18} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.suggestionText}>Porady oszczędnościowe</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.suggestion} onPress={() => setInputText('Przeanalizuj moje wydatki')}>
          <LinearGradient colors={GRADIENTS.expense} style={styles.suggestionIcon}>
            <Ionicons name="analytics" size={18} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.suggestionText}>Analiza wydatków</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.suggestion} onPress={() => setInputText('Jak stworzyć budżet domowy?')}>
          <LinearGradient colors={GRADIENTS.sunset} style={styles.suggestionIcon}>
            <Ionicons name="wallet" size={18} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.suggestionText}>Planowanie budżetu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.suggestion} onPress={() => setInputText('Podsumowanie moich finansów')}>
          <LinearGradient colors={GRADIENTS.ocean} style={styles.suggestionIcon}>
            <Ionicons name="document-text" size={18} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.suggestionText}>Podsumowanie finansów</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoadingHistory) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#1A1A2E', '#16213E']} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.white} />
          <Text style={styles.loadingText}>Ładowanie...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1A1A2E', '#16213E']} style={styles.headerGradient}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{PL.aiAssistant}</Text>
              <Text style={styles.subtitle}>Powered by GPT-5.2</Text>
            </View>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={14} color={COLORS.white} />
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={styles.content}>
          {messages.length === 0 ? (
            renderWelcome()
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}
        </View>

        {isLoading && (
          <View style={styles.typingIndicator}>
            <LinearGradient colors={GRADIENTS.primary} style={styles.typingAvatar}>
              <Ionicons name="sparkles" size={14} color={COLORS.white} />
            </LinearGradient>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.typingText}>{PL.thinking}</Text>
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={PL.askQuestion}
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <LinearGradient
                colors={inputText.trim() && !isLoading ? GRADIENTS.primary : [COLORS.border, COLORS.border]}
                style={styles.sendGradient}
              >
                <Ionicons name="send" size={18} color={inputText.trim() && !isLoading ? COLORS.white : COLORS.textMuted} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  headerGradient: { paddingBottom: 10 },
  safeArea: { paddingHorizontal: SPACING.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm, paddingBottom: SPACING.sm },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.white },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 4 },
  aiBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  keyboardView: { flex: 1 },
  content: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, marginTop: -10 },
  welcomeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  welcomeIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  welcomeTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs, textAlign: 'center' },
  welcomeText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginBottom: SPACING.xl },
  suggestions: { width: '100%', gap: SPACING.sm },
  suggestion: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, gap: SPACING.md },
  suggestionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  suggestionText: { fontSize: 14, color: COLORS.text, fontWeight: '500', flex: 1 },
  messagesList: { padding: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.md },
  messageContainer: { flexDirection: 'row', marginBottom: SPACING.md, alignItems: 'flex-end' },
  userMessageContainer: { justifyContent: 'flex-end' },
  aiMessageContainer: { justifyContent: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.xs },
  messageBubble: { maxWidth: '78%', borderRadius: BORDER_RADIUS.lg },
  userBubble: { borderBottomRightRadius: 4, overflow: 'hidden' },
  userBubbleGradient: { padding: SPACING.md },
  aiBubble: { backgroundColor: COLORS.white, borderBottomLeftRadius: 4, padding: SPACING.md },
  userMessageText: { fontSize: 15, color: COLORS.white, lineHeight: 22 },
  aiMessageText: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  typingAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.xs },
  typingBubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.lg, gap: SPACING.sm },
  typingText: { fontSize: 14, color: COLORS.textLight },
  inputContainer: { padding: SPACING.md, paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm },
  input: { flex: 1, backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: 16, color: COLORS.text, maxHeight: 100, minHeight: 44 },
  sendButton: { borderRadius: 22, overflow: 'hidden' },
  sendButtonDisabled: {},
  sendGradient: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
});
