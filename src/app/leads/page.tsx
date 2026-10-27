'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLeads } from '@/context/LeadsContext';
import { StatusDropdown } from '@/components/leads/StatusDropdown';
import { NotesModal } from '@/components/leads/NotesModal';
import { Lead, LeadStatus } from '@/types';
import {
  Users,
  Search,
  Filter,
  Trash2,
  FileEdit,
  ExternalLink,
  MapPin,
  Phone,
  AlertCircle,
  Plus,
  Globe,
  CheckCircle2,
  X,
  Mail,
  Pencil,
} from 'lucide-react';
import { VarexAvatar } from '@/components/assistant/VarexAvatar';
import { SendEmailModal } from '@/components/email/SendEmailModal';

const STATUS_FILTERS: (LeadStatus | 'All')[] = [
  'All',
  'New',
  'Contacted',
  'Interested',
  'Won',
  'Lost',
];

export default function SavedLeadsPage() {
  const { leads, loading, updateStatus, updateNotes, updateEmail, deleteLead } = useLeads();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'All'>('All');
  const [onlyMissingWebsite, setOnlyMissingWebsite] = useState(false);
  const [leadForNotes, setLeadForNotes] = useState<Lead | null>(null);
  const [leadForEmail, setLeadForEmail] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Email editing state
  const [editingEmailLead, setEditingEmailLead] = useState<Lead | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Status filter
      if (selectedStatus !== 'All' && lead.status !== selectedStatus) {
        return false;
      }

      // Missing website filter
      if (onlyMissingWebsite && lead.website_url && lead.website_url.trim() !== '') {
        return false;
      }

      // Search query filter (matches name, address, category, or notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = lead.business_name.toLowerCase().includes(q);
        const matchesAddress = lead.address?.toLowerCase().includes(q) ?? false;
        const matchesCategory = lead.category?.toLowerCase().includes(q) ?? false;
        const matchesNotes = lead.notes?.toLowerCase().includes(q) ?? false;

        if (!matchesName && !matchesAddress && !matchesCategory && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [leads, selectedStatus, onlyMissingWebsite, searchQuery]);

  // Counts for tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: leads.length };
    STATUS_FILTERS.forEach((st) => {
      if (st !== 'All') {
        counts[st] = leads.filter((l) => l.status === st).length;
      }
    });
    return counts;
  }, [leads]);

  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;
    setDeleting(true);
    await deleteLead(leadToDelete.id);
    setDeleting(false);
    setLeadToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-neutral-900">
            Saved Leads & Client Tracking
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-1">
            Manage your prospective clients, update contact status, and review outreach notes.
          </p>
        </div>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Find More Leads</span>
        </Link>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 md:p-5 shadow-xs space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-neutral-100">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedStatus === status
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <span>{status}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedStatus === status
                    ? 'bg-neutral-700 text-neutral-200'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {statusCounts[status] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search input & website toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search leads by business name, city, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs text-neutral-900 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle for Missing Website (High Opportunity) */}
          <label className="inline-flex items-center gap-2 text-xs text-neutral-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyMissingWebsite}
              onChange={(e) => setOnlyMissingWebsite(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
            />
            <span className="font-medium">Only show businesses without a website</span>
            <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded-full font-semibold">
              High Priority
            </span>
          </label>
        </div>
      </div>

      {/* Leads Table / List */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900">
              {leads.length === 0
                ? 'No saved leads yet'
                : 'No leads match your search criteria'}
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              {leads.length === 0
                ? 'Start by searching for local businesses in your city and save them to your outreach list.'
                : 'Try adjusting your search query, status filter, or clearing the missing website filter.'}
            </p>
            {leads.length === 0 ? (
              <div className="pt-2">
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search Businesses</span>
                </Link>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('All');
                    setOnlyMissingWebsite(false);
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Business & Address</th>
                  <th className="px-5 py-3 font-semibold">Contact & Customer Email</th>
                  <th className="px-5 py-3 font-semibold">Website Opportunity</th>
                  <th className="px-5 py-3 font-semibold">Outreach Status</th>
                  <th className="px-5 py-3 font-semibold">Notes & Log</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredLeads.map((lead) => {
                  const hasWebsite = Boolean(lead.website_url && lead.website_url.trim() !== '');

                  return (
                    <tr key={lead.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Business Name & Address */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-semibold text-neutral-900 text-xs">
                          {lead.business_name}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-1">
                          <MapPin className="w-3 h-3 shrink-0 text-neutral-400" />
                          <span className="truncate">{lead.address || 'Address unlisted'}</span>
                        </div>
                        {lead.category && (
                          <span className="inline-block mt-1 text-[10px] bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded font-medium">
                            {lead.category}
                          </span>
                        )}
                      </td>

                      {/* Contact Info (Phone, Email, & Google Maps) */}
                      <td className="px-5 py-4 space-y-1.5">
                        {/* Customer Email */}
                        {lead.email ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Mail className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                            <a
                              href={`mailto:${lead.email}`}
                              className="font-mono text-[11px] text-neutral-900 font-medium hover:underline truncate max-w-[140px]"
                              title={`Customer Email: ${lead.email}`}
                            >
                              {lead.email}
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEmailLead(lead);
                                setEmailInput(lead.email || '');
                              }}
                              className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded cursor-pointer"
                              title="Edit customer email"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const suggested = lead.website_url
                                ? `contact@${lead.website_url.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')}`
                                : `contact@${lead.business_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
                              setEditingEmailLead(lead);
                              setEmailInput(suggested);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            title="Add potential customer email"
                          >
                            <Mail className="w-2.5 h-2.5 text-cyan-600" />
                            <span>+ Set Customer Email</span>
                          </button>
                        )}

                        {lead.phone ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Phone className="w-3 h-3 text-neutral-400" />
                            <a
                              href={`tel:${lead.phone}`}
                              className="font-mono text-[11px] text-neutral-600 hover:text-neutral-900 hover:underline"
                            >
                              {lead.phone}
                            </a>
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-[10px] block">No phone listed</span>
                        )}

                        <div>
                          {lead.google_maps_url ? (
                            <a
                              href={lead.google_maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                            >
                              <span>Open Google Maps</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : null}
                        </div>
                      </td>

                      {/* Website Opportunity */}
                      <td className="px-5 py-4">
                        {hasWebsite ? (
                          <a
                            href={
                              lead.website_url.startsWith('http')
                                ? lead.website_url
                                : `https://${lead.website_url}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-neutral-800 hover:underline font-mono"
                          >
                            <Globe className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span className="truncate max-w-[120px]">
                              {lead.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            <span>No Website Listed</span>
                          </span>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-5 py-4">
                        <StatusDropdown
                          currentStatus={lead.status}
                          onChange={(newStatus) => updateStatus(lead.id, newStatus)}
                        />
                      </td>

                      {/* Notes & Tracking */}
                      <td className="px-5 py-4 max-w-xs">
                        <button
                          type="button"
                          onClick={() => setLeadForNotes(lead)}
                          className="text-left w-full group cursor-pointer"
                        >
                          {lead.notes ? (
                            <p className="text-[11px] text-neutral-700 line-clamp-2 group-hover:text-neutral-950">
                              {lead.notes}
                            </p>
                          ) : (
                            <p className="text-[11px] text-neutral-400 italic group-hover:text-neutral-600">
                              + Add notes or outreach details...
                            </p>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              window.dispatchEvent(
                                new CustomEvent('open-varex-ai', {
                                  detail: {
                                    lead,
                                    prompt: `Draft a personalized cold email pitch for ${lead.business_name} offering website and lead generation services.`,
                                  },
                                })
                              );
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-cyan-900 bg-cyan-50/80 hover:bg-cyan-100/90 border border-cyan-200/80 rounded-lg transition-all shadow-xs cursor-pointer"
                            title="Ask Varex AI to pitch this business"
                          >
                            <VarexAvatar size="xs" />
                            <span>Varex Pitch</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLeadForEmail(lead)}
                            className="p-1.5 text-neutral-500 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Send Outreach Email via Resend"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setLeadForNotes(lead)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Edit Notes"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setLeadToDelete(lead)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes Modal */}
      <NotesModal
        lead={leadForNotes}
        isOpen={Boolean(leadForNotes)}
        onClose={() => setLeadForNotes(null)}
        onSave={async (id, notes) => {
          const ok = await updateNotes(id, notes);
          return ok;
        }}
      />

      {/* Delete Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-neutral-200 shadow-2xl p-6 space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Delete Saved Lead?
                </h3>
                <p className="text-xs text-neutral-500">
                  Are you sure you want to remove{' '}
                  <strong className="text-neutral-800">{leadToDelete.business_name}</strong> from your leads? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer disabled:opacity-60 shadow-xs"
              >
                {deleting ? 'Deleting...' : 'Delete Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Email Modal */}
      {editingEmailLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-neutral-200 shadow-2xl p-5 space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-700" />
                <h3 className="text-sm font-semibold text-neutral-900">
                  Customer Contact Email
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmailLead(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Set or update the potential customer contact email for{' '}
              <strong className="text-neutral-800">{editingEmailLead.business_name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Customer Email Address
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. contact@business.com"
                className="w-full px-3 py-2 text-xs text-neutral-900 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 font-mono shadow-2xs"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingEmailLead(null)}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingEmail}
                onClick={async () => {
                  setSavingEmail(true);
                  await updateEmail(editingEmailLead.id, emailInput.trim());
                  setSavingEmail(false);
                  setEditingEmailLead(null);
                }}
                className="px-4 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {savingEmail ? 'Saving...' : 'Save Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal via Resend */}
      <SendEmailModal
        isOpen={Boolean(leadForEmail)}
        onClose={() => setLeadForEmail(null)}
        lead={leadForEmail}
        initialTo={leadForEmail?.email || ''}
        initialSubject={leadForEmail ? `Quick question regarding ${leadForEmail.business_name}'s website` : ''}
      />
    </div>
  );
}
