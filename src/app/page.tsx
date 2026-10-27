'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLeads } from '@/context/LeadsContext';
import { StatusBadge } from '@/components/leads/StatusBadge';
import { StatusDropdown } from '@/components/leads/StatusDropdown';
import { NotesModal } from '@/components/leads/NotesModal';
import { Lead } from '@/types';
import {
  Users,
  Target,
  Send,
  AlertCircle,
  Search,
  ExternalLink,
  MapPin,
  FileEdit,
  Phone,
  ArrowRight,
  Coffee,
  Scissors,
  Stethoscope,
  Store,
} from 'lucide-react';

export default function DashboardPage() {
  const { leads, stats, loading, updateStatus, updateNotes } = useLeads();
  const [selectedLeadForNotes, setSelectedLeadForNotes] = useState<Lead | null>(null);

  // Quick preset categories to search
  const quickCategories = [
    { name: 'Cafés', category: 'cafes', icon: Coffee },
    { name: 'Salons', category: 'salons', icon: Scissors },
    { name: 'Clinics', category: 'clinics', icon: Stethoscope },
    { name: 'Local Shops', category: 'local shops', icon: Store },
  ];

  const recentLeads = leads.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-neutral-900">
            Outreach Dashboard
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-1">
            Track business prospects, website opportunities, and outreach status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find New Clients</span>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards (4 Required Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saved Leads */}
        <div className="p-5 bg-white border border-neutral-200 rounded-2xl shadow-xs hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Total Saved Leads
            </span>
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-neutral-900">
              {loading ? '-' : stats.totalLeads}
            </span>
            <span className="text-xs text-neutral-500">businesses saved</span>
          </div>
          <p className="text-xs text-neutral-400 mt-2">Active in your prospect pipeline</p>
        </div>

        {/* New Leads */}
        <div className="p-5 bg-white border border-neutral-200 rounded-2xl shadow-xs hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              New Leads
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200/60 flex items-center justify-center shadow-2xs">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-neutral-900">
              {loading ? '-' : stats.newLeads}
            </span>
            <span className="text-xs text-cyan-700 font-semibold">pending outreach</span>
          </div>
          <p className="text-xs text-neutral-400 mt-2">Ready for first contact</p>
        </div>

        {/* Contacted Leads */}
        <div className="p-5 bg-white border border-neutral-200 rounded-2xl shadow-xs hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Contacted Leads
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shadow-2xs">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-neutral-900">
              {loading ? '-' : stats.contactedLeads}
            </span>
            <span className="text-xs text-amber-700 font-semibold">in discussion</span>
          </div>
          <p className="text-xs text-neutral-400 mt-2">Follow-ups in progress</p>
        </div>

        {/* Without Website (High Opportunity Target) */}
        <div className="p-5 bg-white border border-neutral-200 rounded-2xl shadow-xs hover:border-neutral-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              No Website Listed
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60 flex items-center justify-center shadow-2xs">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-neutral-900">
              {loading ? '-' : stats.leadsWithoutWebsite}
            </span>
            <span className="text-xs text-rose-600 font-semibold">prime candidates</span>
          </div>
          <p className="text-xs text-neutral-400 mt-2">Highest likelihood for web design</p>
        </div>
      </div>

      {/* Quick Search Jump Cards */}
      <div className="p-5 bg-white border border-neutral-200 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Quick Discovery Presets
          </h2>
          <span className="text-xs text-neutral-400">Jump directly to business categories</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.category}
                href={`/search?category=${encodeURIComponent(cat.category)}`}
                className="p-3 rounded-xl bg-neutral-50/70 hover:bg-neutral-100/80 border border-neutral-200 transition-all flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 group-hover:text-neutral-900 shadow-2xs">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-900 block">
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                    Find clients <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Leads Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Recently Saved Leads
            </h2>
            <p className="text-xs text-neutral-500">
              Your latest prospects and their outreach progress
            </p>
          </div>
          <Link
            href="/leads"
            className="text-xs font-medium text-neutral-900 hover:text-neutral-600 flex items-center gap-1"
          >
            <span>View All ({leads.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {leads.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900">No leads saved yet</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Search for local businesses like restaurants, cafés, salons, or clinics and save them to your pipeline.
            </p>
            <div className="pt-2">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Local Businesses</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/40 text-neutral-500 border-b border-neutral-200/50 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Business</th>
                  <th className="px-5 py-3 font-semibold">Contact & Links</th>
                  <th className="px-5 py-3 font-semibold">Website Opportunity</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Notes</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-neutral-50/70 transition-colors">
                    {/* Business Name & Address */}
                    <td className="px-5 py-4 max-w-xs">
                      <div className="font-medium text-neutral-900 text-xs truncate">
                        {lead.business_name}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0 text-neutral-400" />
                        <span className="truncate">{lead.address || 'Address unlisted'}</span>
                      </div>
                      {lead.category && (
                        <span className="inline-block mt-1 text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">
                          {lead.category}
                        </span>
                      )}
                    </td>

                    {/* Contact & Links */}
                    <td className="px-5 py-4 space-y-1">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="inline-flex items-center gap-1 text-neutral-600 hover:text-neutral-900 font-mono text-[11px]"
                        >
                          <Phone className="w-3 h-3 text-neutral-400" />
                          <span>{lead.phone}</span>
                        </a>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">No phone listed</span>
                      )}
                      <div>
                        {lead.google_maps_url ? (
                          <a
                            href={lead.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                          >
                            <span>Google Maps</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : null}
                      </div>
                    </td>

                    {/* Website status */}
                    <td className="px-5 py-4">
                      {lead.website_url ? (
                        <a
                          href={lead.website_url.startsWith('http') ? lead.website_url : `https://${lead.website_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-neutral-800 hover:underline font-mono"
                        >
                          <span className="truncate max-w-[130px]">{lead.website_url.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-neutral-400" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-2.5 h-2.5" />
                          <span>No Website Listed</span>
                        </span>
                      )}
                    </td>

                    {/* Status dropdown */}
                    <td className="px-5 py-4">
                      <StatusDropdown
                        currentStatus={lead.status}
                        onChange={(newStatus) => updateStatus(lead.id, newStatus)}
                      />
                    </td>

                    {/* Notes preview */}
                    <td className="px-5 py-4 max-w-[200px]">
                      <button
                        type="button"
                        onClick={() => setSelectedLeadForNotes(lead)}
                        className="text-left group cursor-pointer"
                      >
                        <p className="text-[11px] text-neutral-600 line-clamp-2 group-hover:text-neutral-900">
                          {lead.notes || <span className="text-neutral-400 italic">+ Add note...</span>}
                        </p>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLeadForNotes(lead)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="Edit Notes"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Notes Modal */}
      <NotesModal
        lead={selectedLeadForNotes}
        isOpen={Boolean(selectedLeadForNotes)}
        onClose={() => setSelectedLeadForNotes(null)}
        onSave={async (id, notes) => {
          const ok = await updateNotes(id, notes);
          return ok;
        }}
      />
    </div>
  );
}
