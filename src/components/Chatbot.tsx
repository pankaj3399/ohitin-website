import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCheck, Clock, RotateCcw, Send, X } from 'lucide-react';
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
  timestamp: number;
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

const formatMessageTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const isFirstInGroup = (messages: ChatMessage[], index: number): boolean => {
  if (index === 0) return true;
  const prev = messages[index - 1];
  const curr = messages[index];
  return prev.sender !== curr.sender || curr.timestamp - prev.timestamp > 120_000;
};

const isLastInGroup = (messages: ChatMessage[], index: number): boolean => {
  if (index === messages.length - 1) return true;
  const curr = messages[index];
  const next = messages[index + 1];
  return curr.sender !== next.sender || next.timestamp - curr.timestamp > 120_000;
};

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
        timestamp: typeof record.timestamp === 'number' ? record.timestamp : Date.now(),
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

  const messageCount = (conversation.messages as unknown[]).length;
  const now = Date.now();
  return (conversation.messages as unknown[]).flatMap((message, index) => {
    if (!message || typeof message !== 'object') return [];
    const entry = message as Record<string, unknown>;
    if (entry.sender !== 'assistant' && entry.sender !== 'user') return [];
    if (typeof entry.text !== 'string' || !entry.text.trim()) return [];

    return [
      {
        id: `conversation-${entry.sender}-${index}`,
        sender: entry.sender,
        text: entry.text.trim(),
        status: 'sent' as const,
        timestamp: now - (messageCount - index) * 1000,
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
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRefs = useRef<number[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    setUnreadCount(0);
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
                  timestamp: Date.now(),
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
            timestamp: Date.now(),
          },
        ]);
        if (!isOpenRef.current) {
          setUnreadCount((n) => n + 1);
        }
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
    setUnreadCount(0);
    window.setTimeout(() => textareaRef.current?.focus(), 350);
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
          timestamp: Date.now(),
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
  const canSend = !!inputValue.trim() && !isClosed && !isSending;

  return (
    <div
      className={`chatbot-ui-font fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-4 ${
        isFullscreen ? 'pointer-events-none opacity-0' : ''
      }`}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 24, scale: 0.92, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 16, scale: 0.95, filter: 'blur(10px)' }}
            transition={CHAT_SPRING}
            style={{ originX: 1, originY: 1 }}
            className="pointer-events-auto flex h-[min(42rem,calc(100vh-6rem))] w-[calc(100vw-2.5rem)] max-w-[26rem] flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0a0a0a]/95 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.85),0_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl"
          >
            {/* ── Ambient glow ── */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.07),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(212,175,55,0.09),transparent_50%)]"
            />

            <div className="relative flex h-full flex-col">
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={avatarImage}
                      alt="AI-GENT 001"
                      className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10"
                    />
                    <span className="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full border-[1.5px] border-[#0a0a0a] bg-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[0.8125rem] font-semibold tracking-[-0.01em] text-white/95">
                      AI-GENT 001
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[0.6rem] font-medium text-emerald-400/70">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
                      Online
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={resetChat}
                    className="rounded-xl p-2 text-white/35 transition-all duration-200 hover:bg-white/[0.06] hover:text-white/70"
                    aria-label="New conversation"
                  >
                    <RotateCcw size={14} strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl p-2 text-white/35 transition-all duration-200 hover:bg-white/[0.06] hover:text-white/70"
                    aria-label="Close chat"
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* ── Header divider ── */}
              <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

              {/* ── Messages ── */}
              <div
                ref={scrollRef}
                className="chatbot-thin-scrollbar flex-1 overflow-y-auto px-4 pb-3 pt-4"
              >
                {messages.map((message, index) => {
                  const isAssistant = message.sender === 'assistant';
                  const isFailed = message.status === 'failed';
                  const first = isFirstInGroup(messages, index);
                  const last = isLastInGroup(messages, index);

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className={`flex items-end gap-2 ${isAssistant ? '' : 'justify-end'} ${first ? 'mt-4' : 'mt-0.5'}`}
                    >
                      {/* Bot avatar — space reserved, shown only on last in group */}
                      {isAssistant && (
                        <div className="mb-0.5 w-6 flex-shrink-0">
                          {last && (
                            <img
                              src={avatarImage}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover ring-1 ring-white/[0.12]"
                            />
                          )}
                        </div>
                      )}

                      <div className={`flex max-w-[78%] flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
                        <div
                          className={`px-3.5 py-2.5 text-[0.8125rem] leading-[1.6] ${
                            isAssistant
                              ? `bg-white/[0.07] text-white/90 ${
                                  first && last
                                    ? 'rounded-2xl rounded-tl-md'
                                    : first
                                      ? 'rounded-2xl rounded-tl-md rounded-bl-md'
                                      : last
                                        ? 'rounded-2xl rounded-tl-sm rounded-bl-md'
                                        : 'rounded-2xl rounded-l-md'
                                }`
                              : isFailed
                                ? `border border-red-500/20 bg-red-500/10 text-red-200/80 ${
                                    first && last
                                      ? 'rounded-2xl rounded-tr-md'
                                      : first
                                        ? 'rounded-2xl rounded-tr-md rounded-br-md'
                                        : last
                                          ? 'rounded-2xl rounded-tr-sm rounded-br-md'
                                          : 'rounded-2xl rounded-r-md'
                                  }`
                                : `border border-amber-500/[0.15] bg-[#2a1f00]/80 text-white/95 ${
                                    first && last
                                      ? 'rounded-2xl rounded-tr-md'
                                      : first
                                        ? 'rounded-2xl rounded-tr-md rounded-br-md'
                                        : last
                                          ? 'rounded-2xl rounded-tr-sm rounded-br-md'
                                          : 'rounded-2xl rounded-r-md'
                                  }`
                          }`}
                        >
                          {message.text}
                        </div>

                        {/* Timestamp + status — only on last message in group */}
                        {last && (
                          <div
                            className={`mt-1 flex items-center gap-1 px-1 text-[0.6rem] text-white/25 ${
                              isAssistant ? '' : 'flex-row-reverse'
                            }`}
                          >
                            <span>{formatMessageTime(message.timestamp)}</span>
                            {!isAssistant && (
                              message.status === 'sending' ? (
                                <Clock size={9} className="opacity-50" />
                              ) : message.status === 'sent' ? (
                                <CheckCheck size={11} className="text-white/30" />
                              ) : message.status === 'failed' ? (
                                <span className="text-[0.6rem] font-medium text-red-400/80">!</span>
                              ) : null
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* ── Typing indicator ── */}
                {(isStarting || isWaitingForReply) && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 flex items-end gap-2"
                  >
                    <div className="w-6 flex-shrink-0">
                      <img
                        src={avatarImage}
                        alt=""
                        className="h-6 w-6 rounded-full object-cover ring-1 ring-white/[0.12]"
                      />
                    </div>
                    <div className="rounded-2xl rounded-tl-md bg-white/[0.07] px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <span className="chatbot-typing-dot h-[5px] w-[5px] rounded-full bg-white/50" />
                        <span className="chatbot-typing-dot h-[5px] w-[5px] rounded-full bg-white/50" />
                        <span className="chatbot-typing-dot h-[5px] w-[5px] rounded-full bg-white/50" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Error ── */}
                {errorText && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 rounded-xl border border-red-500/15 bg-red-500/[0.06] px-4 py-3 text-[0.75rem] leading-relaxed text-red-200/70"
                  >
                    {errorText}
                  </motion.div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Quick replies ── */}
              {quickReplies.length > 0 && !isClosed && !isWaitingForReply && (
                <div className="flex flex-wrap gap-1.5 px-4 pb-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => void sendMessage(reply)}
                      className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[0.6875rem] font-medium text-white/65 transition-all duration-200 hover:border-amber-500/20 hover:bg-amber-500/[0.06] hover:text-white/90"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Input area ── */}
              <div className="px-3 pb-3 pt-1.5">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendMessage(inputValue);
                  }}
                >
                  <div className="chatbot-input-wrap flex items-end gap-1.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-1.5 pl-4 pr-1.5">
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          if (canSend) {
                            void sendMessage(inputValue);
                          }
                        }
                      }}
                      placeholder={
                        isClosed ? 'This conversation has ended.' : 'Message…'
                      }
                      disabled={isClosed || isSending}
                      rows={1}
                      className="chatbot-thin-scrollbar max-h-28 w-full resize-none bg-transparent py-[7px] text-[0.8125rem] leading-normal text-white/90 outline-none placeholder:text-white/20"
                    />
                    <motion.button
                      type="submit"
                      disabled={!canSend}
                      animate={canSend ? { scale: 1 } : { scale: 0.88 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className={`chatbot-send-btn flex-shrink-0 rounded-xl p-[7px] transition-all duration-200 disabled:pointer-events-none disabled:opacity-30 ${
                        canSend
                          ? 'bg-amber-500/15 text-amber-400/90 hover:bg-amber-500/25'
                          : 'text-white/25'
                      }`}
                      aria-label="Send message"
                    >
                      <Send size={15} strokeWidth={1.75} />
                    </motion.button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── FAB ── */}
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.94 }}
            transition={CHAT_SPRING}
            onClick={() => void openWidget()}
            whileHover={{ y: -3, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-full border border-white/[0.08] bg-[#0a0a0a]/80 px-3 py-2.5 text-left text-white shadow-[0_16px_48px_-8px_rgba(0,0,0,0.7)] backdrop-blur-2xl transition-colors duration-300 hover:border-white/[0.12] hover:bg-[#0a0a0a]/90"
            aria-label="Open chat"
          >
            {/* Ambient sheen */}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_0%,transparent_40%,rgba(212,175,55,0.08)_100%)]"
            />
            {/* Breathing ring */}
            <motion.span
              aria-hidden="true"
              animate={{ scale: [1, 1.06, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0.5 rounded-full border border-white/[0.06]"
            />
            <div className="relative">
              <img
                src={avatarImage}
                alt="AI-GENT 001"
                className="relative h-12 w-12 rounded-full object-cover ring-1 ring-white/10"
              />
              {/* Unread badge */}
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-400 px-1 text-[0.5625rem] font-bold leading-none text-black"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div className="relative pr-2">
              <p className="text-[0.8125rem] font-semibold tracking-[-0.01em] leading-none">
                AI-GENT 001
              </p>
              <p className="mt-1 text-[0.6875rem] font-medium text-white/45">
                How may I help you?
              </p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;
