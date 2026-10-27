'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useLeads } from '@/context/LeadsContext';
import { Lead, EmailActionData } from '@/types';
import {
  X,
  Send,
  User,
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  Building2,
  ChevronDown,
  Mail,
  MessageSquare,
  ShieldAlert,
  DollarSign,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { SendEmailModal } from '@/components/email/SendEmailModal';
import { VarexAvatar } from '@/components/assistant/VarexAvatar';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  emailAction?: EmailActionData;
}

export const FloatingAssistant: React.FC = () => {
  const pathname = usePathname();
  const { leads, updateStatus } = useLeads();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalData, setEmailModalData] = useState<{
    to?: string;
    subject?: string;
    body?: string;
    lead?: Lead | null;
  }>({});
  const [isSendingDirectEmail, setIsSendingDirectEmail] = useState<string | null>(null);
  const [directSendResult, setDirectSendResult] = useState<Record<string, string>>({});

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'floating-welcome',
      role: 'assistant',
      content: `**Varex AI Ready.** Engineered by Dylan Ramos ([dylanramos.site](https://dylanramos.site)). Command me to draft pitches, send outreach emails, or inspect potential customer contact emails!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen to custom 'open-varex-ai' event from lead cards
  useEffect(() => {
    const handleTrigger = (e: CustomEvent<{ lead?: Lead; prompt?: string }>) => {
      setIsOpen(true);
      if (e.detail?.lead) {
        setActiveLead(e.detail.lead);
      }
      if (e.detail?.prompt) {
        setInput(e.detail.prompt);
      }
    };

    window.addEventListener('open-varex-ai' as unknown as keyof WindowEventMap, handleTrigger as EventListener);
    return () => {
      window.removeEventListener('open-varex-ai' as unknown as keyof WindowEventMap, handleTrigger as EventListener);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const openSendEmail = (content: string, overrideTo?: string) => {
    const subjectMatch = content.match(/\*\*Subject:\*\*\s*(.*)/i) || content.match(/Subject:\s*(.*)/i);
    const subject = subjectMatch
      ? subjectMatch[1].trim()
      : `Quick question regarding ${activeLead?.business_name || 'your business'}'s website`;

    let cleanedBody = content
      .replace(/\*\*To:\*\*.*\n+/gi, '')
      .replace(/^###.*\n+/gm, '')
      .replace(/\*\*Subject:\*\*.*\n+/gi, '')
      .replace(/Subject:.*\n+/gi, '')
      .replace(/---[\s\S]*$/m, '')
      .trim();

    setEmailModalData({
      to: overrideTo || activeLead?.email || '',
      subject,
      body: cleanedBody,
      lead: activeLead,
    });
    setEmailModalOpen(true);
  };

  const handleSendDirectEmail = async (action: EmailActionData, msgId: string) => {
    if (!action.to || !action.to.includes('@')) {
      alert('Please enter a valid recipient email address.');
      return;
    }

    setIsSendingDirectEmail(msgId);
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: action.to.trim(),
          subject: action.subject.trim(),
          text: action.body.trim(),
          leadId: action.leadId || activeLead?.id,
          leadName: action.leadName || activeLead?.business_name,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to dispatch email.');
      }

      if (activeLead?.id) {
        await updateStatus(activeLead.id, 'Contacted');
      }

      setDirectSendResult((prev) => ({
        ...prev,
        [msgId]: `Transmitted to ${action.to}!`,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending email';
      setDirectSendResult((prev) => ({
        ...prev,
        [msgId]: `Failed: ${msg}`,
      }));
    } finally {
      setIsSendingDirectEmail(null);
    }
  };

  const handleOpenGmailDirect = (action: EmailActionData) => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      action.to.trim()
    )}&su=${encodeURIComponent(action.subject.trim())}&body=${encodeURIComponent(action.body.trim())}`;
    window.open(gmailUrl, '_blank');
  };

  // Don't render floating drawer if already on /assistant page
  if (pathname === '/assistant') return null;

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          leadContext: activeLead || undefined,
        }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'ai-' + Date.now(),
            role: 'assistant',
            content: data.reply,
            emailAction: data.emailAction,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: 'Failed to connect to Varex AI service. Please verify your connection.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 p-2 sm:px-3.5 sm:py-2.5 bg-neutral-900 text-white rounded-full shadow-xl hover:bg-neutral-800 transition-all duration-200 flex items-center gap-2 cursor-pointer border border-neutral-700 group"
          title="Ask Varex AI • Engineered by Dylan Ramos (https://dylanramos.site)"
        >
          <VarexAvatar size="sm" showBadge status="online" />
          <span className="text-xs font-semibold pr-1 tracking-tight hidden sm:inline-block">
            Ask Varex AI
          </span>
        </button>
      )}

      {/* Floating Slide-Out Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[95vw] sm:w-[420px] h-[580px] bg-white rounded-2xl border border-neutral-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <VarexAvatar size="sm" showBadge status="online" />
              <div>
                <h3 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>Varex AI</span>
                  <span className="text-[9px] font-semibold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 px-1.5 py-0.2 rounded-full">
                    Core v2
                  </span>
                </h3>
                <p className="text-[10px] text-neutral-400">
                  {activeLead ? (
                    <span>
                      Lead: <strong>{activeLead.business_name}</strong>
                    </span>
                  ) : (
                    <a
                      href="https://dylanramos.site"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white underline"
                    >
                      Engineered by Dylan Ramos
                    </a>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href="/assistant"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
                title="Open Fullscreen Page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Lead Pill (if selected) */}
          {activeLead && (
            <div className="px-3 py-1.5 bg-neutral-50 border-b border-neutral-200 text-[11px] text-neutral-700 flex items-center justify-between">
              <span className="truncate flex items-center gap-1">
                <Building2 className="w-3 h-3 text-neutral-500" />
                <strong className="truncate">{activeLead.business_name}</strong>
                {activeLead.email && (
                  <span className="text-[10px] text-cyan-800 font-mono">({activeLead.email})</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setActiveLead(null)}
                className="text-[10px] text-neutral-400 hover:text-neutral-700 underline cursor-pointer shrink-0 ml-2"
              >
                Clear lead
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs bg-neutral-50/50">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {isUser ? (
                    <div className="w-6 h-6 rounded-md bg-neutral-900 text-white flex items-center justify-center shrink-0 text-[10px]">
                      <User className="w-3 h-3" />
                    </div>
                  ) : (
                    <VarexAvatar size="xs" />
                  )}

                  <div
                    className={`max-w-[85%] rounded-xl p-3 leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-neutral-900 text-white rounded-tr-xs shadow-xs'
                        : 'bg-white border border-neutral-200 text-neutral-900 rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    <div>{msg.content}</div>

                    {/* Interactive Direct Dispatch Station in Floating Widget */}
                    {msg.emailAction && (
                      <div className="mt-2.5 p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-900 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-cyan-700" />
                            <span>Email Dispatch Ready</span>
                          </span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                            Ready
                          </span>
                        </div>
                        <p className="text-neutral-600 truncate">
                          <strong>To:</strong> <span className="font-mono text-neutral-900">{msg.emailAction.to}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          <button
                            type="button"
                            disabled={isSendingDirectEmail === msg.id}
                            onClick={() => handleSendDirectEmail(msg.emailAction!, msg.id)}
                            className="px-2.5 py-1 text-[10px] font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {isSendingDirectEmail === msg.id ? (
                              <>
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-2.5 h-2.5" />
                                <span>Send (Resend)</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenGmailDirect(msg.emailAction!)}
                            className="px-2 py-1 text-[10px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded flex items-center gap-1 cursor-pointer"
                          >
                            <Mail className="w-2.5 h-2.5 text-red-600" />
                            <span>Gmail</span>
                          </button>
                        </div>
                        {directSendResult[msg.id] && (
                          <p className="text-[10px] text-emerald-700 font-medium">
                            {directSendResult[msg.id]}
                          </p>
                        )}
                      </div>
                    )}

                    {!isUser && (
                      <div className="mt-2 pt-1.5 border-t border-neutral-200/60 flex items-center justify-between text-[10px] text-neutral-400">
                        <span>{msg.timestamp}</span>
                        <div className="flex items-center gap-1.5">
                          {!msg.emailAction && (
                            <button
                              type="button"
                              onClick={() => openSendEmail(msg.content)}
                              className="text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 cursor-pointer"
                              title="Send Email"
                            >
                              <Mail className="w-2.5 h-2.5 text-cyan-600" />
                              <span>Send</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="hover:text-neutral-800 flex items-center gap-1 cursor-pointer px-1 py-0.5"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-[11px] text-neutral-600 bg-white p-2.5 rounded-lg border border-neutral-200 shadow-2xs">
                <VarexAvatar size="xs" status="thinking" />
                <span>Varex AI is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-1.5 bg-neutral-100/90 border-t border-neutral-200 flex gap-1.5 overflow-x-auto text-[10px]">
            <button
              type="button"
              onClick={() => handleSend('Show potential customer prospects with direct emails')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 hover:border-neutral-900 shrink-0 cursor-pointer transition-colors shadow-2xs"
            >
              <Mail className="w-3 h-3 text-cyan-600" />
              <span>Customer Emails</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('Who is your creator?')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 hover:border-neutral-900 shrink-0 cursor-pointer transition-colors shadow-2xs"
            >
              <span>Creator</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('Draft cold email pitch')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 hover:border-neutral-900 shrink-0 cursor-pointer transition-colors shadow-2xs"
            >
              <Mail className="w-3 h-3 text-indigo-600" />
              <span>Cold Pitch</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('Write 3-sentence SMS pitch')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 hover:border-neutral-900 shrink-0 cursor-pointer transition-colors shadow-2xs"
            >
              <MessageSquare className="w-3 h-3 text-amber-600" />
              <span>SMS Pitch</span>
            </button>
          </div>

          {/* Footer Input Bar */}
          <div className="p-3 bg-white border-t border-neutral-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  activeLead
                    ? `Command Varex AI: "Send email to ${activeLead.business_name}..."`
                    : 'Command Varex AI: "Send email to..." or ask a question...'
                }
                disabled={loading}
                className="flex-1 px-3 py-2 text-xs text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 shadow-2xs"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        initialTo={emailModalData.to}
        initialSubject={emailModalData.subject}
        initialBody={emailModalData.body}
        lead={emailModalData.lead}
      />
    </>
  );
};
