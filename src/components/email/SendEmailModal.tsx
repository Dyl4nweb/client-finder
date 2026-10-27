'use client';

import React, { useState, useEffect } from 'react';
import { Lead } from '@/types';
import { useLeads } from '@/context/LeadsContext';
import {
  X,
  Send,
  Mail,
  CheckCircle2,
  AlertCircle,
  Building2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  User,
} from 'lucide-react';
import { VarexAvatar } from '@/components/assistant/VarexAvatar';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  lead?: Lead | null;
  onSuccess?: (details: { id: string; to: string; subject: string }) => void;
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  initialTo = '',
  initialSubject = '',
  initialBody = '',
  lead,
  onSuccess,
}) => {
  const { updateStatus, updateNotes } = useLeads();

  const personalEmail = 'kurtdylanviray@gmail.com';
  const senderName = 'Dylan Ramos';

  const defaultRecipient = initialTo || lead?.email || '';

  const [to, setTo] = useState(defaultRecipient);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);

  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ id: string; to: string; mode: string } | null>(null);

  // Sync props when modal opens
  useEffect(() => {
    if (isOpen) {
      setTo(initialTo || lead?.email || '');
      setSubject(initialSubject);
      setBody(initialBody);
      setErrorMessage(null);
      setSuccessInfo(null);
    }
  }, [isOpen, initialTo, initialSubject, initialBody, lead]);

  if (!isOpen) return null;

  // Method 1: Open directly in Gmail (Sends 100% natively from kurtdylanviray@gmail.com)
  const handleOpenInGmail = async () => {
    if (!to.trim()) {
      setErrorMessage('Please enter a recipient email before opening in Gmail.');
      return;
    }

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      to.trim()
    )}&su=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body.trim())}`;

    window.open(gmailUrl, '_blank');

    // Automatically update lead status in CRM to Contacted
    if (lead) {
      try {
        await updateStatus(lead.id, 'Contacted');
        const timestamp = new Date().toLocaleString([], {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const outreachNote = `[Gmail Outreach Opened on ${timestamp}]\nFrom: ${personalEmail}\nTo: ${to.trim()}\nSubject: "${subject.trim()}"`;
        const updatedNotes = lead.notes ? `${lead.notes}\n\n${outreachNote}` : outreachNote;
        await updateNotes(lead.id, updatedNotes);
      } catch (crmErr) {
        console.warn('Could not auto-update lead CRM record:', crmErr);
      }
    }

    setSuccessInfo({ id: 'opened-in-gmail', to: to.trim(), mode: 'Gmail Web App' });

    if (onSuccess) {
      onSuccess({ id: 'gmail-opened', to: to.trim(), subject: subject.trim() });
    }
  };

  // Method 2: Send via Resend API (automated background dispatch)
  const handleSendViaResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    if (!to.trim() || !to.includes('@')) {
      setErrorMessage('Please enter a valid recipient email address.');
      return;
    }

    if (!subject.trim()) {
      setErrorMessage('Please provide an email subject line.');
      return;
    }

    if (!body.trim()) {
      setErrorMessage('Please enter email content before sending.');
      return;
    }

    setSending(true);

    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          text: body.trim(),
          leadId: lead?.id,
          leadName: lead?.business_name,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to dispatch email via Resend.');
      }

      setSuccessInfo({ id: data.id, to: data.to, mode: 'Resend API' });

      // Automatically update lead in CRM
      if (lead) {
        try {
          await updateStatus(lead.id, 'Contacted');
          const timestamp = new Date().toLocaleString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          const outreachNote = `[Resend Outreach Sent on ${timestamp}]\nFrom Display: ${senderName} (Replies to: ${personalEmail})\nTo: ${to.trim()}\nSubject: "${subject.trim()}"`;
          const updatedNotes = lead.notes ? `${lead.notes}\n\n${outreachNote}` : outreachNote;
          await updateNotes(lead.id, updatedNotes);
        } catch (crmErr) {
          console.warn('Could not auto-update lead CRM record:', crmErr);
        }
      }

      if (onSuccess) {
        onSuccess({ id: data.id, to: data.to, subject: subject.trim() });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred while sending.';
      setErrorMessage(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-email-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 id="send-email-title" className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <span>Send Client Outreach Email</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Send cold pitch directly from your personal Gmail or via Resend
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-white overflow-y-auto space-y-4">
          {/* Sender Identity Card */}
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                G
              </div>
              <div>
                <p className="font-semibold text-neutral-900 flex items-center gap-1.5">
                  <span>{senderName}</span>
                  <span className="text-[10px] text-neutral-500 font-mono">({personalEmail})</span>
                </p>
                <p className="text-[11px] text-neutral-500">
                  Client replies will arrive in your <strong className="text-neutral-700">Gmail inbox</strong>.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-neutral-700 bg-white border border-neutral-200 px-2 py-0.5 rounded-full shrink-0">
              Personal Sender
            </span>
          </div>

          {/* Lead Context Pill */}
          {lead && (
            <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <Building2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="font-semibold text-neutral-900 truncate">{lead.business_name}</span>
                <span className="text-neutral-400">•</span>
                <span className="text-neutral-500 truncate">{lead.category}</span>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 ml-2">
                Auto-updates CRM to Contacted
              </span>
            </div>
          )}

          {/* Success Banner */}
          {successInfo && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-900 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {successInfo.mode === 'Gmail Web App'
                    ? 'Opened in Gmail & Logged to CRM!'
                    : 'Outreach Email Dispatched via Resend!'}
                </span>
              </div>
              <p className="text-emerald-800 leading-relaxed text-[11px]">
                {successInfo.mode === 'Gmail Web App' ? (
                  <>
                    Gmail compose window opened for <strong>{successInfo.to}</strong>. Your lead was updated to{' '}
                    <span className="font-semibold text-emerald-900">Contacted</span> in your CRM pipeline.
                  </>
                ) : (
                  <>
                    Transmitted to <strong>{successInfo.to}</strong>. All replies will be routed to{' '}
                    <strong>{personalEmail}</strong>. Resend ID:{' '}
                    <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono text-[10px]">
                      {successInfo.id}
                    </code>
                  </>
                )}
              </p>
              <div className="pt-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium text-xs shadow-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-2 text-rose-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Unable to dispatch email</p>
                  <p className="text-[11px] leading-relaxed">{errorMessage}</p>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded border border-rose-200/80 text-[11px] text-neutral-700 space-y-1">
                <p className="font-semibold text-neutral-900 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-red-600" />
                  <span>Instant Solution: Send from your real Gmail</span>
                </p>
                <p className="text-neutral-600 leading-relaxed">
                  Click the red <strong className="text-neutral-900">&quot;Open in Gmail&quot;</strong> button below to compose and send this pitch directly from your logged-in Google account (<span className="font-mono">{personalEmail}</span>) with 100% Google SPF/DKIM verification and zero domain hurdles!
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSendViaResend} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Recipient Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="owner@businessname.com"
                className="w-full px-3.5 py-2.5 text-xs text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 shadow-2xs font-mono"
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                Enter the business owner, manager, or inquiry email address.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Subject Line <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={`Quick question regarding ${lead?.business_name || 'your business'}'s website`}
                className="w-full px-3.5 py-2.5 text-xs text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 shadow-2xs font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-neutral-700">
                  Message Content <span className="text-rose-500">*</span>
                </label>
                <a
                  href="https://dylanramos.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-cyan-800 font-medium flex items-center gap-1.5 bg-cyan-50/80 border border-cyan-200/70 px-2 py-0.5 rounded-full hover:bg-cyan-100 hover:text-cyan-950 transition-colors"
                  title="Visit Dylan Ramos portfolio (https://dylanramos.site)"
                >
                  <VarexAvatar size="xs" />
                  <span>Engineered by Dylan Ramos</span>
                </a>
              </div>
              <textarea
                required
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write or review your cold outreach message here..."
                className="w-full px-3.5 py-2.5 text-xs text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 shadow-2xs font-sans leading-relaxed resize-y"
              />
            </div>

            <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-[11px] text-neutral-400">
                Sender: <strong className="text-neutral-700">{personalEmail}</strong>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Send via Real Gmail Button */}
                <button
                  type="button"
                  onClick={handleOpenInGmail}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  title="Open in your personal Gmail to send directly from kurtdylanviray@gmail.com"
                >
                  <Mail className="w-3.5 h-3.5 text-red-600" />
                  <span>Open in Gmail (Send from Me)</span>
                </button>

                {/* Send via Resend API Button */}
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
                  title="Automated dispatch via Resend API"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send via Resend</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
