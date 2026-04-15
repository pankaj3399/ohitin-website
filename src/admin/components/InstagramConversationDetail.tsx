import { ArrowLeft, Mail, Phone, Tag, User } from 'lucide-react';
import type { InstagramConversation } from '../types';
import { formatDate } from '../utils/format';

interface Props {
  conversation: InstagramConversation;
  onBack: () => void;
}

const statusColorMap: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: 'rgba(59,130,246,0.1)', text: '#60A5FA', dot: '#3B82F6' },
  WAITING_FOR_CONTACT: { bg: 'rgba(245,158,11,0.1)', text: '#FBBF24', dot: '#F59E0B' },
  COMPLETED: { bg: 'rgba(16,185,129,0.1)', text: '#34D399', dot: '#10B981' },
};

const tagColorMap: Record<string, { bg: string; text: string; border: string }> = {
  INVESTOR: { bg: 'rgba(139,92,246,0.12)', text: '#C4B5FD', border: 'rgba(139,92,246,0.2)' },
  CREATIVE: { bg: 'rgba(59,130,246,0.12)', text: '#93C5FD', border: 'rgba(59,130,246,0.2)' },
  GENERAL: { bg: 'rgba(100,116,139,0.12)', text: '#94A3B8', border: 'rgba(100,116,139,0.2)' },
  VIP: { bg: 'rgba(245,158,11,0.12)', text: '#FCD34D', border: 'rgba(245,158,11,0.2)' },
  TALENT: { bg: 'rgba(236,72,153,0.12)', text: '#F9A8D4', border: 'rgba(236,72,153,0.2)' },
  BRAND: { bg: 'rgba(16,185,129,0.12)', text: '#6EE7B7', border: 'rgba(16,185,129,0.2)' },
  EMAIL_RECEIVED: { bg: 'rgba(16,185,129,0.12)', text: '#6EE7B7', border: 'rgba(16,185,129,0.2)' },
  PHONE_RECEIVED: { bg: 'rgba(245,158,11,0.12)', text: '#FCD34D', border: 'rgba(245,158,11,0.2)' },
};

const defaultTagColor = { bg: 'rgba(100,116,139,0.1)', text: '#94A3B8', border: 'rgba(100,116,139,0.15)' };

export function InstagramConversationDetail({ conversation, onBack }: Props) {
  const sc = statusColorMap[conversation.status] || { bg: 'rgba(100,116,139,0.1)', text: '#94A3B8', dot: '#64748B' };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className="flex items-center gap-3 border-b px-5 py-4"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg border text-slate-400 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.03] hover:text-white"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <ArrowLeft size={14} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[14px] font-semibold text-white">
              {conversation.senderName || conversation.senderId}
            </h3>
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-medium"
              style={{ background: sc.bg, color: sc.text }}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: sc.dot }} />
              {conversation.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Started {formatDate(conversation.createdAt)}
          </p>
        </div>
      </div>

      {/* Meta info cards */}
      <div
        className="grid grid-cols-2 gap-3 border-b px-5 py-4"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* Sender ID */}
        <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <User size={13} className="text-slate-500" />
          <div>
            <p className="text-[10px] text-slate-600">Sender ID</p>
            <p className="text-[12px] font-medium text-slate-300 font-mono">{conversation.senderId}</p>
          </div>
        </div>

        {/* Profile Type */}
        <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <User size={13} className="text-slate-500" />
          <div>
            <p className="text-[10px] text-slate-600">Profile</p>
            <p className="text-[12px] font-medium capitalize text-slate-300">{conversation.profileType || '—'}</p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <Mail size={13} className="text-slate-500" />
          <div>
            <p className="text-[10px] text-slate-600">Email</p>
            <p className="text-[12px] font-medium text-slate-300">{conversation.capturedData?.email || '—'}</p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <Phone size={13} className="text-slate-500" />
          <div>
            <p className="text-[10px] text-slate-600">Phone</p>
            <p className="text-[12px] font-medium text-slate-300">{conversation.capturedData?.phone || '—'}</p>
          </div>
        </div>
      </div>

      {/* Tags */}
      {conversation.tags.length > 0 && (
        <div
          className="flex items-center gap-2 border-b px-5 py-3"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <Tag size={12} className="text-slate-500" />
          <div className="flex flex-wrap gap-1">
            {conversation.tags.map((tag) => {
              const tc = tagColorMap[tag.toUpperCase()] || defaultTagColor;
              return (
                <span
                  key={tag}
                  className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                  style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="admin-scrollbar flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {conversation.messages.length === 0 ? (
          <p className="py-8 text-center text-[12px] text-slate-600">No messages yet</p>
        ) : (
          conversation.messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg._id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-2.5"
                  style={
                    isUser
                      ? {
                          background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                          borderBottomRightRadius: '4px',
                        }
                      : {
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderBottomLeftRadius: '4px',
                        }
                  }
                >
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white">
                    {msg.text}
                  </p>
                  <p
                    className="mt-1 text-right text-[10px]"
                    style={{ color: isUser ? 'rgba(255,255,255,0.6)' : 'rgba(148,163,184,0.6)' }}
                  >
                    {formatDate(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
