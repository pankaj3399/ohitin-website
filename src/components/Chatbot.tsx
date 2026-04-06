import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Trash2Icon, X } from 'lucide-react';
import avatarImage from '../assets/avatar.jpeg';

const CONVERSATION_API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const ANONYMOUS_CLIENT_ID_STORAGE_KEY = 'chatbot_anonymous_client_id';
const CHATBOT_STORAGE_KEY = 'chatbot_conversation_state';
const MIN_REPLY_DELAY_MS = 45_000;
const MAX_REPLY_DELAY_MS = 900_000;
const MAX_VISUAL_TYPING_DELAY_MS = 1800;
const DEFAULT_GREETING =
  "Hi I am AI-GENT 001, Ohitiin's personal assistant. How may I help you?";
const CHAT_SPRING = {
  type: 'spring',
  stiffness: 260,
  damping: 24,
  mass: 0.9,
} as const;

type ChatSender = 'assistant' | 'user';

interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
  status?: 'sending' | 'sent' | 'failed';
}

interface ConversationSnapshot {
  currentFlow?: string;
  messageStep?: number;
  tags: string[];
  isComplete?: boolean;
}

interface ChatbotProps {
  isFullscreen: boolean;
}

interface StoredChatbotState {
  conversationId: string | null;
  conversation: ConversationSnapshot;
  messages: ChatMessage[];
  quickReplies: string[];
}

const createAnonymousClientId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `anon_${crypto.randomUUID()}`;
  }

  return `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const getAnonymousClientId = () => {
  if (typeof window === 'undefined') {
    return createAnonymousClientId();
  }

  try {
    const existingId = window.localStorage.getItem(ANONYMOUS_CLIENT_ID_STORAGE_KEY);
    if (existingId) return existingId;

    const nextId = createAnonymousClientId();
    window.localStorage.setItem(ANONYMOUS_CLIENT_ID_STORAGE_KEY, nextId);
    return nextId;
  } catch {
    return createAnonymousClientId();
  }
};

const normalizeTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
};

const normalizeMessages = (value: unknown): ChatMessage[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    if (record.sender !== 'assistant' && record.sender !== 'user') return [];
    if (typeof record.text !== 'string' || !record.text.trim()) return [];

    const status =
      record.status === 'sending' || record.status === 'sent' || record.status === 'failed'
        ? record.status
        : undefined;

    return [
      {
        id:
          typeof record.id === 'string' && record.id.trim()
            ? record.id
            : `${record.sender}-${index}-${Date.now()}`,
        sender: record.sender,
        text: record.text.trim(),
        status,
      },
    ];
  });
};

const extractConversationId = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.conversationId === 'string') return record.conversationId;
  if (record.conversation && typeof record.conversation === 'object') {
    const conversation = record.conversation as Record<string, unknown>;
    if (typeof conversation.id === 'string') return conversation.id;
    if (typeof conversation._id === 'string') return conversation._id;
    if (typeof conversation.conversationId === 'string') {
      return conversation.conversationId;
    }
  }
  if (typeof record.id === 'string') return record.id;
  if (typeof record._id === 'string') return record._id;
  return null;
};

const extractConversationSnapshot = (payload: unknown): ConversationSnapshot => {
  const emptySnapshot: ConversationSnapshot = { tags: [] };
  if (!payload || typeof payload !== 'object') return emptySnapshot;

  const record = payload as Record<string, unknown>;
  const source =
    record.conversation && typeof record.conversation === 'object'
      ? (record.conversation as Record<string, unknown>)
      : record;

  const status = typeof source.status === 'string' ? source.status.toLowerCase() : '';

  return {
    currentFlow:
      typeof source.currentFlow === 'string' ? source.currentFlow : undefined,
    messageStep:
      typeof source.messageStep === 'number' ? source.messageStep : undefined,
    tags: normalizeTags(source.tags),
    isComplete:
      typeof source.isComplete === 'boolean'
        ? source.isComplete
        : status === 'completed' || status === 'closed' || status === 'ended',
  };
};

const extractAssistantText = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const candidates: unknown[] = [
    record.reply,
    record.response,
    record.message,
    record.assistantMessage,
    record.text,
  ];

  if (record.data && typeof record.data === 'object') {
    const data = record.data as Record<string, unknown>;
    candidates.push(
      data.reply,
      data.response,
      data.message,
      data.assistantMessage,
      data.text
    );
  }

  if (record.assistantMessage && typeof record.assistantMessage === 'object') {
    const assistantMessage = record.assistantMessage as Record<string, unknown>;
    candidates.unshift(assistantMessage.text, assistantMessage.message);
  }

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
};

const extractAssistantDelayMs = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const assistantMessage =
    record.assistantMessage && typeof record.assistantMessage === 'object'
      ? (record.assistantMessage as Record<string, unknown>)
      : null;
  const delay =
    typeof assistantMessage?.delayMs === 'number'
      ? assistantMessage.delayMs
      : typeof record.delayMs === 'number'
        ? record.delayMs
        : null;

  if (delay === null) return null;
  return Math.min(Math.max(delay, MIN_REPLY_DELAY_MS), MAX_REPLY_DELAY_MS);
};

const getVisualReplyDelay = (delayMs: number | null) => {
  if (!delayMs || delayMs <= 0) return 0;
  return Math.min(delayMs, MAX_VISUAL_TYPING_DELAY_MS);
};

const extractQuickReplies = (payload: unknown): string[] => {
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  const assistantMessage =
    record.assistantMessage && typeof record.assistantMessage === 'object'
      ? (record.assistantMessage as Record<string, unknown>)
      : null;
  const quickReplies = assistantMessage?.quickReplies ?? record.quickReplies;
  return normalizeTags(quickReplies);
};

const extractConversationClosed = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return false;
  const record = payload as Record<string, unknown>;
  return record.conversationClosed === true;
};

const extractApiErrorMessage = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null;

  const record = payload as Record<string, unknown>;
  const candidates: unknown[] = [record.error, record.message, record.detail];

  if (record.data && typeof record.data === 'object') {
    const data = record.data as Record<string, unknown>;
    candidates.push(data.error, data.message, data.detail);
  }

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
};

const readStoredChatState = (): StoredChatbotState | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(CHATBOT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      conversationId:
        typeof parsed.conversationId === 'string' ? parsed.conversationId : null,
      conversation: extractConversationSnapshot(parsed.conversation),
      messages: normalizeMessages(parsed.messages),
      quickReplies: normalizeTags(parsed.quickReplies),
    };
  } catch {
    return null;
  }
};

const writeStoredChatState = (state: StoredChatbotState) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(CHATBOT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Best effort persistence only.
  }
};

const clearStoredChatState = () => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(CHATBOT_STORAGE_KEY);
  } catch {
    // Best effort persistence only.
  }
};

const extractConversationMessages = (payload: unknown): ChatMessage[] => {
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  if (!record.conversation || typeof record.conversation !== 'object') return [];

  const conversation = record.conversation as Record<string, unknown>;
  if (!Array.isArray(conversation.messages)) return [];

  return conversation.messages.flatMap((message, index) => {
    if (!message || typeof message !== 'object') return [];
    const entry = message as Record<string, unknown>;
    if (entry.sender !== 'assistant' && entry.sender !== 'user') return [];
    if (typeof entry.text !== 'string' || !entry.text.trim()) return [];

    return [
      {
        id: `conversation-${entry.sender}-${index}`,
        sender: entry.sender,
        text: entry.text.trim(),
        status: 'sent',
      },
    ];
  });
};

const extractInitialGreeting = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  if (!record.conversation || typeof record.conversation !== 'object') return null;

  const conversation = record.conversation as Record<string, unknown>;
  if (!Array.isArray(conversation.messages)) return null;

  const firstAssistantMessage = conversation.messages.find((message) => {
    if (!message || typeof message !== 'object') return false;
    const entry = message as Record<string, unknown>;
    return entry.sender === 'assistant' && typeof entry.text === 'string';
  });

  if (!firstAssistantMessage || typeof firstAssistantMessage !== 'object') {
    return null;
  }

  const entry = firstAssistantMessage as Record<string, unknown>;
  return typeof entry.text === 'string' ? entry.text.trim() : null;
};

const Chatbot: React.FC<ChatbotProps> = ({ isFullscreen }) => {
  const storedState = readStoredChatState();
  const [anonymousClientId] = useState(getAnonymousClientId);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(storedState?.messages ?? []);
  const [conversationId, setConversationId] = useState<string | null>(
    storedState?.conversationId ?? null
  );
  const [conversation, setConversation] = useState<ConversationSnapshot>(
    storedState?.conversation ?? {
      tags: [],
    }
  );
  const [quickReplies, setQuickReplies] = useState<string[]>(storedState?.quickReplies ?? []);
  const [inputValue, setInputValue] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isWaitingForReply, setIsWaitingForReply] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRefs = useRef<number[]>([]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isWaitingForReply]);

  useEffect(() => {
    return () => {
      timerRefs.current.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  useEffect(() => {
    writeStoredChatState({
      conversationId,
      conversation,
      messages,
      quickReplies,
    });
  }, [conversation, conversationId, messages, quickReplies]);

  const resetChat = useCallback(() => {
    timerRefs.current.forEach((timerId) => window.clearTimeout(timerId));
    timerRefs.current = [];
    setMessages([]);
    setConversationId(null);
    setConversation({ tags: [] });
    setQuickReplies([]);
    setInputValue('');
    setIsStarting(false);
    setIsSending(false);
    setIsWaitingForReply(false);
    setErrorText(null);
    clearStoredChatState();
  }, []);

  const syncConversation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${CONVERSATION_API_BASE}/api/conversations/${id}`);
      if (!response.ok) return;
      const payload = await response.json();
      setConversation(extractConversationSnapshot(payload));
    } catch {
      // Silent refresh only.
    }
  }, []);

  const ensureConversation = useCallback(async () => {
    if (conversationId || messages.length > 0) return conversationId;

    setIsStarting(true);
    setErrorText(null);

    try {
      const response = await fetch(`${CONVERSATION_API_BASE}/api/conversations/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: anonymousClientId }),
      });

      if (!response.ok) {
        throw new Error(`Start request failed with ${response.status}`);
      }

      const payload = await response.json();
      const id = extractConversationId(payload);
      const initialMessages = extractConversationMessages(payload);

      setConversationId(id);
      setConversation(extractConversationSnapshot(payload));
      const backendGreeting = extractInitialGreeting(payload);

      setMessages((current) =>
        current.length > 0
          ? current
          : initialMessages.length > 0
            ? initialMessages
            : [
                {
                  id: 'assistant-greeting',
                  sender: 'assistant',
                  text:
                    typeof backendGreeting === 'string' && backendGreeting.trim()
                      ? backendGreeting.trim()
                      : DEFAULT_GREETING,
                  status: 'sent',
                },
              ]
      );

      if (id) {
        void syncConversation(id);
      }

      return id;
    } finally {
      setIsStarting(false);
    }
  }, [anonymousClientId, conversationId, messages.length, syncConversation]);

  const deliverAssistantReply = useCallback(
    (text: string, delayMs: number, options?: { closeAfterReply?: boolean }) => {
    const timerId = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text,
          status: 'sent',
        },
      ]);
      if (options?.closeAfterReply) {
        setConversation((current) => ({
          ...current,
          isComplete: true,
        }));
      }
      setIsWaitingForReply(false);
      timerRefs.current = timerRefs.current.filter((id) => id !== timerId);
    }, delayMs);

    timerRefs.current.push(timerId);
    setIsWaitingForReply(true);
    },
    []
  );

  const openWidget = useCallback(async () => {
    setIsOpen(true);
    if (!conversationId && messages.length === 0 && !isStarting) {
      try {
        await ensureConversation();
      } catch {
        setErrorText('The assistant is unavailable right now.');
      }
    }
  }, [conversationId, ensureConversation, isStarting, messages.length]);

  const sendMessage = useCallback(
    async (rawMessage: string) => {
      const text = rawMessage.trim();
      if (!text || isSending) return;

      const userMessageId = `user-${Date.now()}`;
      setInputValue('');
      setErrorText(null);
      setQuickReplies([]);
      setMessages((current) => [
        ...current,
        {
          id: userMessageId,
          sender: 'user',
          text,
          status: 'sending',
        },
      ]);
      setIsSending(true);

      try {
        const id = await ensureConversation();
        const response = await fetch(`${CONVERSATION_API_BASE}/api/conversations/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: id ?? null,
            userId: anonymousClientId,
            message: text,
          }),
        });

        if (!response.ok) {
          let apiErrorMessage: string | null = null;

          try {
            const errorPayload = await response.json();
            apiErrorMessage = extractApiErrorMessage(errorPayload);
          } catch {
            // Ignore parse errors and use the status-based fallback below.
          }

          throw new Error(apiErrorMessage || `Message request failed with ${response.status}`);
        }

        const payload = await response.json();
        const nextConversationId = extractConversationId(payload);
        const snapshot = extractConversationSnapshot(payload);
        const assistantText = extractAssistantText(payload);
        const assistantDelayMs = getVisualReplyDelay(extractAssistantDelayMs(payload));
        const conversationClosed = extractConversationClosed(payload);
        const closeAfterReply = conversationClosed && !!assistantText;

        if (nextConversationId) {
          setConversationId(nextConversationId);
        }

        setMessages((current) =>
          current.map((message) =>
            message.id === userMessageId ? { ...message, status: 'sent' } : message
          )
        );
        setConversation({
          ...snapshot,
          isComplete: closeAfterReply ? false : snapshot.isComplete || conversationClosed,
        });
        setQuickReplies(extractQuickReplies(payload));

        if (nextConversationId) {
          void syncConversation(nextConversationId);
        }

        if (assistantText) {
          deliverAssistantReply(assistantText, assistantDelayMs, {
            closeAfterReply,
          });
        } else if (conversationClosed) {
          setConversation((current) => ({
            ...current,
            isComplete: true,
          }));
        }
      } catch (error) {
        setMessages((current) =>
          current.map((message) =>
            message.id === userMessageId ? { ...message, status: 'failed' } : message
          )
        );
        const message =
          error instanceof Error && error.message
            ? error.message
            : 'The message could not be sent right now.';
        setErrorText(message);
      } finally {
        setIsSending(false);
      }
    },
    [anonymousClientId, deliverAssistantReply, ensureConversation, isSending, syncConversation]
  );

  const isClosed = !!conversation.isComplete;

  return (
    <div
      className={`chatbot-ui-font fixed bottom-4 right-4 z-[90] flex flex-col items-end gap-3 ${
        isFullscreen ? 'pointer-events-none opacity-0' : ''
      }`}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 28, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 18, scale: 0.94, filter: 'blur(8px)' }}
            transition={CHAT_SPRING}
            style={{ originX: 1, originY: 1 }}
            className="pointer-events-auto flex h-[42rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-[28px] border border-white/15 bg-black/80 shadow-2xl backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.18),transparent_36%)]"
            />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={avatarImage}
                      alt="AI-GENT 001"
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-white/15"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-black bg-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">AI-GENT 001</p>
                    <p className="text-xs text-white/60">Personal assistant to Ohitiin</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={resetChat}
                    className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                    aria-label="Clear chat"
                  >
                    <Trash2Icon size={16} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                    aria-label="Close chat"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="chatbot-thin-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4"
              >
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    className={`w-fit max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.sender === 'assistant'
                        ? 'bg-white/10 text-white'
                        : message.status === 'failed'
                          ? 'ml-auto border border-red-400/40 bg-red-500/10 text-red-100'
                          : 'ml-auto bg-white text-black'
                    }`}
                    style={{ width: 'fit-content' }}
                  >
                    {message.text}
                  </motion.div>
                ))}

                {(isStarting || isWaitingForReply) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-fit max-w-[85%] rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80"
                    style={{ width: 'fit-content' }}
                  >
                    <div className="flex items-center gap-1.5 py-1">
                      <motion.span
                        className="h-2.5 w-2.5 rounded-full bg-white/70"
                        animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <motion.span
                        className="h-2.5 w-2.5 rounded-full bg-white/70"
                        animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: 0.12,
                        }}
                      />
                      <motion.span
                        className="h-2.5 w-2.5 rounded-full bg-white/70"
                        animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: 0.24,
                        }}
                      />
                    </div>
                  </motion.div>
                )}

                {errorText && (
                  <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {errorText}
                  </div>
                )}
              </div>

              {quickReplies.length > 0 && !isClosed && !isWaitingForReply && (
                <div className="flex flex-wrap gap-2 px-4 pb-3">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => void sendMessage(reply)}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white transition hover:bg-white/10"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage(inputValue);
                }}
                className="border-t border-white/10 p-3"
              >
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                  <input
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder={isClosed ? 'This conversation has ended.' : 'Type your message'}
                    disabled={isClosed || isSending}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isClosed || isSending}
                    className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, y: 18, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={CHAT_SPRING}
            onClick={() => void openWidget()}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-full border border-white/15 bg-black/70 px-3 py-3 text-left text-white shadow-xl backdrop-blur-xl transition hover:bg-black/85"
            aria-label="Open chat"
          >
            <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_45%,rgba(212,175,55,0.18))]" />
            <motion.span
              aria-hidden="true"
              animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.55, 0.35] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-1 rounded-full border border-white/10"
            />
            <img
              src={avatarImage}
              alt="AI-GENT 001"
              className="relative h-14 w-14 rounded-full object-cover ring-1 ring-white/20"
            />
            <div className="relative pr-2">
              <p className="text-sm font-semibold leading-none">AI-GENT 001</p>
              <p className="mt-1 text-xs text-white/65">How may I help you?</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;
