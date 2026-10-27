import { Lead, LeadStatus, DashboardStats } from '@/types';
import { createClient, isSupabaseConfigured } from './supabase/client';

const LOCAL_STORAGE_KEY = 'client_finder_leads_v1';

// Helper to get local storage fallback (starts completely empty, ZERO hardcoded data)
function getLocalLeads(): Lead[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalLeads(leads: Lead[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(leads));
  window.dispatchEvent(new Event('client-finder-leads-updated'));
}

export async function fetchAllLeads(): Promise<Lead[]> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((item: any) => ({
            ...item,
            email: item.email || getLeadEmail(item as Lead),
          })) as Lead[];
        }

        if (error) {
          console.warn('Supabase fetch error:', error.message);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch from Supabase:', err);
    }
  }

  return getLocalLeads().map((item) => ({
    ...item,
    email: item.email || getLeadEmail(item),
  }));
}

export function getLeadEmail(lead: Lead): string {
  if (lead.email && lead.email.trim()) return lead.email.trim();
  if (lead.notes && lead.notes.includes('[Email:')) {
    const match = lead.notes.match(/\[Email:\s*([^\]]+)\]/i);
    if (match && match[1]) return match[1].trim();
  }
  return '';
}

export async function saveLeadRecord(leadData: {
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
}): Promise<{ lead: Lead; alreadyExists: boolean }> {
  const configured = isSupabaseConfigured();

  const formattedNotes = leadData.email
    ? leadData.notes
      ? `[Email: ${leadData.email.trim()}]\n${leadData.notes}`
      : `[Email: ${leadData.email.trim()}]`
    : (leadData.notes || '');

  if (configured) {
    try {
      const supabase = createClient();
      if (supabase) {
        let userId: string | null = null;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            userId = user.id;
          }
        } catch {
          // Unauthenticated or PIN session
        }

        // Check for existing lead by external_place_id to prevent duplicates
        if (leadData.external_place_id) {
          const query = supabase
            .from('leads')
            .select('*')
            .eq('external_place_id', leadData.external_place_id);

          if (userId) {
            query.eq('user_id', userId);
          }

          const { data: existing } = await query.maybeSingle();

          if (existing) {
            const parsedLead = {
              ...(existing as Lead),
              email: (existing as Lead).email || getLeadEmail(existing as Lead),
            };
            return { lead: parsedLead, alreadyExists: true };
          }
        }

        // Attempt insert with email; fallback without email column if Supabase table lacks it
        let insertData: any = {
          user_id: userId,
          business_name: leadData.business_name,
          category: leadData.category || 'General',
          address: leadData.address || '',
          phone: leadData.phone || '',
          website_url: leadData.website_url || '',
          google_maps_url: leadData.google_maps_url || '',
          external_place_id: leadData.external_place_id || '',
          status: leadData.status || 'New',
          notes: formattedNotes,
          email: leadData.email || '',
        };

        let { data, error } = await supabase
          .from('leads')
          .insert(insertData)
          .select('*')
          .single();

        if (error && error.message?.includes('column "email"')) {
          delete insertData.email;
          const retry = await supabase
            .from('leads')
            .insert(insertData)
            .select('*')
            .single();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }

        if (data) {
          const parsedLead = {
            ...(data as Lead),
            email: leadData.email || getLeadEmail(data as Lead),
          };
          return { lead: parsedLead, alreadyExists: false };
        }
      }
    } catch (err) {
      console.warn('Supabase insert failed, saving to local leads storage:', err);
    }
  }

  // Local storage fallback (starts clean and only contains user-saved leads)
  const currentLeads = getLocalLeads();
  const existing = currentLeads.find(
    (l) => l.external_place_id && l.external_place_id === leadData.external_place_id
  );

  if (existing) {
    return { lead: existing, alreadyExists: true };
  }

  const newLead: Lead = {
    id: 'lead-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    business_name: leadData.business_name,
    category: leadData.category || 'General',
    address: leadData.address || '',
    phone: leadData.phone || '',
    email: leadData.email || '',
    website_url: leadData.website_url || '',
    google_maps_url: leadData.google_maps_url || '',
    external_place_id: leadData.external_place_id || '',
    status: leadData.status || 'New',
    notes: formattedNotes,
    created_at: new Date().toISOString(),
  };

  const updated = [newLead, ...currentLeads];
  saveLocalLeads(updated);
  return { lead: newLead, alreadyExists: false };
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<boolean> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase
          .from('leads')
          .update({ status })
          .eq('id', id);

        if (!error) return true;
        console.warn('Supabase update status error:', error.message);
      }
    } catch (err) {
      console.warn('Error updating status in Supabase:', err);
    }
  }

  const leads = getLocalLeads();
  const index = leads.findIndex((l) => l.id === id);
  if (index !== -1) {
    leads[index].status = status;
    saveLocalLeads([...leads]);
    return true;
  }
  return false;
}

export async function updateLeadNotes(id: string, notes: string): Promise<boolean> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase
          .from('leads')
          .update({ notes })
          .eq('id', id);

        if (!error) return true;
        console.warn('Supabase update notes error:', error.message);
      }
    } catch (err) {
      console.warn('Error updating notes in Supabase:', err);
    }
  }

  const leads = getLocalLeads();
  const index = leads.findIndex((l) => l.id === id);
  if (index !== -1) {
    leads[index].notes = notes;
    saveLocalLeads([...leads]);
    return true;
  }
  return false;
}

export async function updateLeadEmail(id: string, email: string): Promise<boolean> {
  const cleanEmail = email.trim();
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      if (supabase) {
        // Try updating direct email column
        let { error } = await supabase
          .from('leads')
          .update({ email: cleanEmail })
          .eq('id', id);

        // If table doesn't have email column, persist into notes
        if (error && error.message?.includes('column "email"')) {
          const { data: leadData } = await supabase
            .from('leads')
            .select('notes')
            .eq('id', id)
            .single();

          let currentNotes = leadData?.notes || '';
          if (currentNotes.includes('[Email:')) {
            currentNotes = currentNotes.replace(/\[Email:\s*[^\]]+\]/i, `[Email: ${cleanEmail}]`);
          } else {
            currentNotes = `[Email: ${cleanEmail}]\n${currentNotes}`;
          }

          const retry = await supabase
            .from('leads')
            .update({ notes: currentNotes })
            .eq('id', id);
          error = retry.error;
        }

        if (!error) return true;
        console.warn('Supabase update email error:', error.message);
      }
    } catch (err) {
      console.warn('Error updating email in Supabase:', err);
    }
  }

  const leads = getLocalLeads();
  const index = leads.findIndex((l) => l.id === id);
  if (index !== -1) {
    leads[index].email = cleanEmail;
    let currentNotes = leads[index].notes || '';
    if (currentNotes.includes('[Email:')) {
      leads[index].notes = currentNotes.replace(/\[Email:\s*[^\]]+\]/i, `[Email: ${cleanEmail}]`);
    } else {
      leads[index].notes = `[Email: ${cleanEmail}]\n${currentNotes}`;
    }
    saveLocalLeads([...leads]);
    return true;
  }
  return false;
}

export async function deleteLeadRecord(id: string): Promise<boolean> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase
          .from('leads')
          .delete()
          .eq('id', id);

        if (!error) return true;
        console.warn('Supabase delete error:', error.message);
      }
    } catch (err) {
      console.warn('Error deleting lead in Supabase:', err);
    }
  }

  const leads = getLocalLeads();
  const filtered = leads.filter((l) => l.id !== id);
  saveLocalLeads(filtered);
  return true;
}

export function computeDashboardStats(leads: Lead[]): DashboardStats {
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'New').length;
  const contactedLeads = leads.filter((l) => l.status === 'Contacted').length;
  const leadsWithoutWebsite = leads.filter(
    (l) => !l.website_url || l.website_url.trim() === ''
  ).length;
  const interestedLeads = leads.filter((l) => l.status === 'Interested').length;
  const wonLeads = leads.filter((l) => l.status === 'Won').length;
  const lostLeads = leads.filter((l) => l.status === 'Lost').length;

  return {
    totalLeads,
    newLeads,
    contactedLeads,
    leadsWithoutWebsite,
    interestedLeads,
    wonLeads,
    lostLeads,
  };
}
