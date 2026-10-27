'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Lead, LeadStatus, DashboardStats } from '@/types';
import {
  fetchAllLeads,
  saveLeadRecord,
  updateLeadStatus,
  updateLeadNotes,
  updateLeadEmail,
  deleteLeadRecord,
  computeDashboardStats,
} from '@/lib/leads-service';
import { useAuth } from './AuthContext';

interface LeadsContextType {
  leads: Lead[];
  stats: DashboardStats;
  loading: boolean;
  refreshLeads: () => Promise<void>;
  saveLead: (leadData: {
    business_name: string;
    category: string;
    address: string;
    phone: string;
    email?: string;
    website_url: string;
    google_maps_url: string;
    external_place_id: string;
    status?: LeadStatus;
    notes?: string;
  }) => Promise<{ success: boolean; alreadyExists: boolean }>;
  updateStatus: (id: string, status: LeadStatus) => Promise<boolean>;
  updateNotes: (id: string, notes: string) => Promise<boolean>;
  updateEmail: (id: string, email: string) => Promise<boolean>;
  deleteLead: (id: string) => Promise<boolean>;
  isPlaceSaved: (externalPlaceId: string) => boolean;
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllLeads();
      setLeads(data);
    } catch (err) {
      console.error('Error loading leads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();

    const handleLocalUpdate = () => {
      loadLeads();
    };

    window.addEventListener('client-finder-leads-updated', handleLocalUpdate);
    return () => {
      window.removeEventListener('client-finder-leads-updated', handleLocalUpdate);
    };
  }, [loadLeads, user]);

  const saveLead = async (leadData: {
    business_name: string;
    category: string;
    address: string;
    phone: string;
    email?: string;
    website_url: string;
    google_maps_url: string;
    external_place_id: string;
    status?: LeadStatus;
    notes?: string;
  }) => {
    const result = await saveLeadRecord(leadData);
    await loadLeads();
    return { success: true, alreadyExists: result.alreadyExists };
  };

  const updateStatus = async (id: string, status: LeadStatus) => {
    const success = await updateLeadStatus(id, status);
    if (success) {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status } : l))
      );
    }
    return success;
  };

  const updateNotes = async (id: string, notes: string) => {
    const success = await updateLeadNotes(id, notes);
    if (success) {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, notes } : l))
      );
    }
    return success;
  };

  const updateEmail = async (id: string, email: string) => {
    const success = await updateLeadEmail(id, email);
    if (success) {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, email } : l))
      );
    }
    return success;
  };

  const deleteLead = async (id: string) => {
    const success = await deleteLeadRecord(id);
    if (success) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
    }
    return success;
  };

  const isPlaceSaved = (externalPlaceId: string) => {
    if (!externalPlaceId) return false;
    return leads.some((l) => l.external_place_id === externalPlaceId);
  };

  const stats = computeDashboardStats(leads);

  return (
    <LeadsContext.Provider
      value={{
        leads,
        stats,
        loading,
        refreshLeads: loadLeads,
        saveLead,
        updateStatus,
        updateNotes,
        updateEmail,
        deleteLead,
        isPlaceSaved,
      }}
    >
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeads() {
  const context = useContext(LeadsContext);
  if (!context) {
    throw new Error('useLeads must be used within a LeadsProvider');
  }
  return context;
}
