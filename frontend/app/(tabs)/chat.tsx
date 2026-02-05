import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { Colors, Gradients } from '../../src/constants/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chat(userMsg.content);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: res.response };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd(), 100);
    }
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
    'Jak oszczędzać pieniądze?',
    'Przeanalizuj moje wydatki',
    'Podsumowanie finansów',
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Asystent AI ✨</Text>
        <Text style={styles.subtitle}>Twój osobisty doradca finansowy</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {messages.length === 0 ? (
          <View style={styles.welcome}>
            <LinearGradient colors={Gradients.primary} style={styles.welcomeIcon}>
              <Ionicons name="sparkles" size={32} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.welcomeTitle}>Cześć! 👋</Text>
            <Text style={styles.welcomeText}>Zapytaj mnie o porady finansowe</Text>
            <View style={styles.suggestions}>
              {suggestions.map((s) => (
                <TouchableOpacity key={s} style={styles.suggestionBtn} onPress={() => setInput(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
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
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.typingText}>Myślę...</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Zadaj pytanie..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={!input.trim() || loading}>
            <LinearGradient colors={input.trim() ? Gradients.primary : [Colors.border, Colors.border]} style={styles.sendGradient}>
              <Ionicons name="send" size={18} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textLight, marginTop: 2 },
  welcome: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  welcomeIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  welcomeTitle: { fontSize: 24, fontWeight: '700', color: Colors.text },
  welcomeText: { fontSize: 15, color: Colors.textLight, marginTop: 4, marginBottom: 24 },
  suggestions: { gap: 10, width: '100%' },
  suggestionBtn: { backgroundColor: Colors.card, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12 },
  suggestionText: { fontSize: 14, color: Colors.text },
  msgList: { padding: 20, paddingBottom: 10 },
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  msgBubble: { maxWidth: '75%', padding: 14, borderRadius: 18 },
  userBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: Colors.card, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, color: Colors.text, lineHeight: 22 },
  userText: { color: Colors.white },
  typing: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8, gap: 8 },
  typingText: { fontSize: 14, color: Colors.textLight },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 16, gap: 12, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.background, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: Colors.text, maxHeight: 100 },
  sendBtn: { borderRadius: 20, overflow: 'hidden' },
  sendGradient: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
});
