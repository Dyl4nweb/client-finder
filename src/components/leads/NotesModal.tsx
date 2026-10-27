'use client';

import React, { useState, useEffect } from 'react';
import { Lead } from '@/types';
import { X, Save, FileText, CheckCircle2 } from 'lucide-react';

interface NotesModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, notes: string) => Promise<boolean>;
}

const QUICK_TAGS = [
  'No website listed',
  'Pitch custom 5-page site',
  'Needs mobile optimization',
  'Sent introductory email',
  'Called - left voicemail',
  'Follow up in 3 days',
];

export const NotesModal: React.FC<NotesModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSave,
}) => {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (lead) {
      setNotes(lead.notes || '');
      setSavedSuccess(false);
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(lead.id, notes);
    setSaving(false);
    if (ok) {
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    }
  };

  const addTag = (tag: string) => {
    if (notes.trim().length === 0) {
      setNotes(tag + '. ');
    } else {
      setNotes((prev) => prev.trim() + '\n• ' + tag);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notes-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 shadow-2xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 id="notes-modal-title" className="text-sm font-semibold text-neutral-900 leading-snug">
                Client Notes & Tracking
              </h3>
              <p className="text-xs text-neutral-500 truncate max-w-xs">
                {lead.business_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
            aria-label="Close notes modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Outreach Log, Pitch Ideas & Contact Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Record your conversation notes, decision maker names, email dates, and custom web pitch notes..."
              className="w-full px-3.5 py-2.5 text-sm text-neutral-900 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 placeholder:text-neutral-400 resize-none shadow-2xs"
            />
          </div>

          {/* Quick Note Snippets */}
          <div>
            <p className="text-xs text-neutral-500 mb-2 font-medium">Quick snippets:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="text-xs px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md border border-neutral-200 transition-colors cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-neutral-50/70 border-t border-neutral-100">
          <span className="text-xs text-neutral-400">
            {lead.category ? `Category: ${lead.category}` : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Notes'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
