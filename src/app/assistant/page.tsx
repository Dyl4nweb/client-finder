'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLeads } from '@/context/LeadsContext';
import { Lead, EmailActionData } from '@/types';
import {
  Send,
  User,
  Copy,
  Check,
  Building2,
  Mail,
  Sparkles,
  HelpCircle,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Phone,
  Globe,
  DollarSign,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { VarexAvatar } from '@/components/assistant/VarexAvatar';
import { SendEmailModal } from '@/components/email/SendEmailModal';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  emailAction?: EmailActionData;
}

const PRESET_PROMPTS = [
  {
    title: 'Show Potential Clients & Emails',
    icon: Mail,
    prompt: 'Show me high-priority potential client prospects along with their direct contact emails.',
  },
  {
    title: 'Draft Cold Email Pitch',
    icon: Mail,
    prompt: 'Draft a high-converting, personalized cold email pitch for my selected lead.',
  },
  {
    title: 'Who is your creator?',
    icon: HelpCircle,
    prompt: 'Who is your creator and who engineered Varex AI?',
  },
  {
    title: '3-Sentence SMS Pitch',
    icon: Phone,
    prompt: 'Write a punchy, 3-sentence SMS message to hook the business owner.',
  },
  {
    title: 'Facebook Objection Rebuttal',
    icon: HelpCircle,
    prompt: 'How do I respond when the business owner says "We only use Facebook, we don\'t need a website"?',
  },
  {
    title: 'Pricing & Packages Guide',
    icon: DollarSign,
    prompt: 'What packages and pricing should I charge for a local 5-page business website?',
  },
];

export default function AssistantPage() {
  const { leads, updateStatus } = useLeads();
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [providerBadge, setProviderBadge] = useState('Varex Core v2');
  const [setupNotice, setSetupNotice] = useState<string | null>(null);

  // Email state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalData, setEmailModalData] = useState<{
    to?: string;
    subject?: string;
    body?: string;
    lead?: Lead | null;
  }>({});
  const [isSendingDirectEmail, setIsSendingDirectEmail] = useState<string | null>(null);
  const [directSendResult, setDirectSendResult] = useState<Record<string, string>>({});

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Welcome to **Varex AI**
Your dedicated autonomous business development and client outreach consultant, engineered by **Dylan Ramos** ([dylanramos.site](https://dylanramos.site)).

I am here to help you:
- **Command me to send outreach emails directly** via Resend API or Gmail.
- **Discover potential customer prospects** and inspect their direct contact emails.
- **Draft personalized cold pitches & SMS messages** tailored to your saved leads.
- **Overcome client objections** (*"Facebook is enough"*, *"Too expensive"*).
- **Structure your website pricing, deliverables & monthly care plans**.

Select a saved lead above to automatically inject their details into our conversation, or command me below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const openSendEmail = (content: string, overrideTo?: string) => {
    const subjectMatch = content.match(/\*\*Subject:\*\*\s*(.*)/i) || content.match(/Subject:\s*(.*)/i);
    const subject = subjectMatch
      ? subjectMatch[1].trim()
      : `Quick question regarding ${selectedLead?.business_name || 'your business'}'s online presence`;

    let cleanedBody = content
      .replace(/\*\*To:\*\*.*\n+/gi, '')
      .replace(/^###.*\n+/gm, '')
      .replace(/\*\*Subject:\*\*.*\n+/gi, '')
      .replace(/Subject:.*\n+/gi, '')
      .replace(/---[\s\S]*$/m, '')
      .trim();

    setEmailModalData({
      to: overrideTo || selectedLead?.email || '',
      subject,
      body: cleanedBody,
      lead: selectedLead,
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
          leadId: action.leadId || selectedLead?.id,
          leadName: action.leadName || selectedLead?.business_name,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to dispatch email.');
      }

      if (selectedLead?.id) {
        await updateStatus(selectedLead.id, 'Contacted');
      }

      setDirectSendResult((prev) => ({
        ...prev,
        [msgId]: `Email transmitted to ${action.to}! Logged to CRM pipeline.`,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending email';
      setDirectSendResult((prev) => ({
        ...prev,
        [msgId]: `Sending failed: ${msg}`,
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

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
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
          leadContext: selectedLead || undefined,
        }),
      });

      const data = await response.json();

      if (data.reply) {
        if (data.provider) setProviderBadge(data.provider);
        if (data.setupNotice) setSetupNotice(data.setupNotice);

        const aiMsg: ChatMessage = {
          id: 'ai-' + Date.now(),
          role: 'assistant',
          content: data.reply,
          emailAction: data.emailAction,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'err-' + Date.now(),
            role: 'assistant',
            content: `Error: ${data.error}. Please try again.`,
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
          content: 'Failed to connect to Varex AI service. Please check your network connection.',
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

  const handleClearChat = () => {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        content: 'Conversation history reset. How can Varex AI assist your outreach today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <VarexAvatar size="lg" showBadge status="online" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
                Varex AI Consultant
              </h1>
              <span className="text-[10px] font-semibold bg-neutral-100 border border-neutral-200 text-neutral-800 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                Varex Core v2
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Autonomous client prospecting &amp; outreach engine •{' '}
              <a
                href="https://dylanramos.site"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-700 hover:text-neutral-950 font-medium underline"
              >
                Engineered by Dylan Ramos
              </a>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setEmailModalData({
                to: selectedLead?.email || '',
                subject: selectedLead ? `Quick question regarding ${selectedLead.business_name}'s website` : '',
                body: '',
                lead: selectedLead,
              });
              setEmailModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Compose Outreach</span>
          </button>
          <button
            type="button"
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:text-neutral-900 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Setup notification banner if in smart fallback mode */}
      {setupNotice && (
        <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl flex items-start gap-2.5 text-xs text-cyan-950">
          <div className="mt-0.5">
            <VarexAvatar size="xs" />
          </div>
          <div className="space-y-0.5">
            <p className="font-semibold">Varex AI is active</p>
            <p className="text-cyan-900 text-[11px] leading-relaxed">{setupNotice}</p>
          </div>
        </div>
      )}

      {/* Lead Context Selector */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-neutral-600" />
            <span>Target Prospect Context (Optional):</span>
          </label>
          {selectedLead && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                !selectedLead.website_url
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {!selectedLead.website_url ? 'No Website Listed' : 'Has Website'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <select
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            className="w-full px-3 py-2 text-xs text-neutral-900 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 bg-white shadow-2xs"
          >
            <option value="">-- No specific lead selected (General outreach mode) --</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.business_name} ({lead.category || 'Service'} • {lead.email || 'No email'})
              </option>
            ))}
          </select>

          {selectedLead ? (
            <div className="text-[11px] text-neutral-600 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200 flex flex-wrap items-center justify-between gap-2">
              <span className="truncate">
                <strong>{selectedLead.business_name}</strong> • {selectedLead.category}
              </span>
              <span className="font-mono text-[10px] text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full shrink-0">
                {selectedLead.email ? `Email: ${selectedLead.email}` : 'No email set'}
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-neutral-500 italic">
              Select a lead from your pipeline to automatically customize pitches and emails.
            </p>
          )}
        </div>
      </div>

      {/* Preset Action Chips */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
          Quick Outreach Prompts
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_PROMPTS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.title}
                type="button"
                onClick={() => handleSend(preset.prompt)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-400 hover:text-neutral-900 rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Icon className="w-3.5 h-3.5 text-neutral-500" />
                <span>{preset.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-[560px]">
        {/* Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-neutral-50/60">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                {isUser ? (
                  <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                ) : (
                  <VarexAvatar size="md" />
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed transition-all ${
                    isUser
                      ? 'bg-neutral-900 text-white rounded-tr-xs shadow-xs'
                      : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-xs shadow-xs'
                  }`}
                >
                  {/* Assistant Content */}
                  <div className="prose prose-xs max-w-none space-y-2 whitespace-pre-wrap">
                    {msg.content}
                  </div>

                  {/* Interactive Direct Email Dispatch Station */}
                  {msg.emailAction && (
                    <div className="mt-3.5 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-cyan-700" />
                          <span>Direct Email Dispatch Station</span>
                        </span>
                        <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                          Ready to Send
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] text-neutral-600 bg-white p-2.5 rounded-lg border border-neutral-200">
                        <p>
                          <strong>To:</strong>{' '}
                          <span className="font-mono text-neutral-900">{msg.emailAction.to}</span>
                        </p>
                        <p>
                          <strong>Subject:</strong>{' '}
                          <span className="text-neutral-900 font-medium">{msg.emailAction.subject}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {/* 1-Click Send via Resend */}
                        <button
                          type="button"
                          disabled={isSendingDirectEmail === msg.id}
                          onClick={() => handleSendDirectEmail(msg.emailAction!, msg.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
                        >
                          {isSendingDirectEmail === msg.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Sending via Resend...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3" />
                              <span>Send via Resend</span>
                            </>
                          )}
                        </button>

                        {/* Open in Gmail */}
                        <button
                          type="button"
                          onClick={() => handleOpenGmailDirect(msg.emailAction!)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          <Mail className="w-3 h-3 text-red-600" />
                          <span>Open in Gmail (Send from Me)</span>
                        </button>

                        {/* Edit in Modal */}
                        <button
                          type="button"
                          onClick={() => openSendEmail(msg.content, msg.emailAction?.to)}
                          className="px-2.5 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg cursor-pointer"
                        >
                          Customize in Modal
                        </button>
                      </div>

                      {directSendResult[msg.id] && (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{directSendResult[msg.id]}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Footer */}
                  <div
                    className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] ${
                      isUser
                        ? 'border-neutral-700 text-neutral-400'
                        : 'border-neutral-200 text-neutral-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    {!isUser && (
                      <div className="flex items-center gap-2">
                        {!msg.emailAction && (
                          <button
                            type="button"
                            onClick={() => openSendEmail(msg.content)}
                            className="inline-flex items-center gap-1 text-[10px] text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 px-2 py-0.5 rounded transition-colors cursor-pointer font-medium shadow-2xs"
                            title="Send this email"
                          >
                            <Mail className="w-3 h-3 text-cyan-700" />
                            <span>Send Email</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="inline-flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                          title="Copy to clipboard"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Pitch</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-start gap-3">
              <VarexAvatar size="md" status="thinking" />
              <div className="p-3.5 bg-white border border-neutral-200 rounded-2xl rounded-tl-xs text-xs text-neutral-600 flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                <span>Varex AI is crafting your outreach strategy...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-neutral-200 bg-white">
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
                selectedLead
                  ? `Command Varex AI: "Send an email to ${selectedLead.business_name}..."`
                  : 'Command Varex AI: "Send an email to client@example.com" or ask any sales question...'
              }
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-xs text-neutral-900 bg-white border border-neutral-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 shadow-2xs"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-400">
            <span>
              Engineered by{' '}
              <a
                href="https://dylanramos.site"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-600 hover:text-neutral-900 font-medium underline"
              >
                Dylan Ramos
              </a>{' '}
              • Varex AI Core
            </span>
            <span>Integrated with Resend API &amp; Gmail</span>
          </div>
        </div>
      </div>

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        initialTo={emailModalData.to}
        initialSubject={emailModalData.subject}
        initialBody={emailModalData.body}
        lead={emailModalData.lead}
      />
    </div>
  );
}
