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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/constants/theme';
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

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const history = await api.getChatHistory();
      const formattedMessages: Message[] = [];
      
      history.forEach((item: any) => {
        formattedMessages.push({
          id: `user-${item.timestamp}`,
          role: 'user',
          content: item.user_message,
          timestamp: new Date(item.timestamp),
        });
        formattedMessages.push({
          id: `ai-${item.timestamp}`,
          role: 'assistant',
          content: item.ai_response,
          timestamp: new Date(item.timestamp),
        });
      });
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await api.sendMessage(userMessage.content);
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(response.timestamp),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie później. 😔',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.aiMessage]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>💰</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeIcon}>
        <Text style={styles.welcomeEmoji}>💰</Text>
      </View>
      <Text style={styles.welcomeTitle}>Witaj! Jestem Cenny Grosz</Text>
      <Text style={styles.welcomeText}>
        Twój osobisty asystent finansowy. Mogę Ci pomóc z:
      </Text>
      <View style={styles.suggestionsList}>
        <TouchableOpacity
          style={styles.suggestion}
          onPress={() => setInputText('Jak mogę lepiej oszczędzać pieniądze?')}
        >
          <Ionicons name="trending-up" size={20} color={COLORS.primary} />
          <Text style={styles.suggestionText}>Porady oszczędnościowe</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.suggestion}
          onPress={() => setInputText('Przeanalizuj moje wydatki')}
        >
          <Ionicons name="analytics" size={20} color={COLORS.primary} />
          <Text style={styles.suggestionText}>Analiza wydatków</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.suggestion}
          onPress={() => setInputText('Jak stworzyć budżet domowy?')}
        >
          <Ionicons name="wallet" size={20} color={COLORS.primary} />
          <Text style={styles.suggestionText}>Planowanie budżetu</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.suggestion}
          onPress={() => setInputText('Podaj mi podsumowanie moich finansów')}
        >
          <Ionicons name="document-text" size={20} color={COLORS.primary} />
          <Text style={styles.suggestionText}>Podsumowanie finansów</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoadingHistory) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>{PL.aiAssistant}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Ładowanie historii...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{PL.aiAssistant}</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>AI</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
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

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.typingIndicator}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>💰</Text>
            </View>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.typingText}>{PL.thinking}</Text>
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={PL.askQuestion}
            placeholderTextColor={COLORS.textLight}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() && !isLoading ? COLORS.white : COLORS.textLight}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  headerBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  welcomeEmoji: {
    fontSize: 40,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  suggestionsList: {
    width: '100%',
    gap: SPACING.sm,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  messagesList: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    ...SHADOWS.sm,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  userMessageText: {
    color: COLORS.white,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  typingText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
});
