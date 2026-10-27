export type LeadStatus = 'New' | 'Contacted' | 'Interested' | 'Won' | 'Lost';

export interface Lead {
  id: string;
  user_id?: string | null;
  business_name: string;
  category: string;
  address: string;
  phone: string;
  email?: string;
  website_url: string;
  google_maps_url: string;
  external_place_id: string;
  status: LeadStatus;
  notes: string;
  created_at: string;
  updated_at?: string;
}

export interface PlaceResult {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  email?: string;
  website: string;
  googleMapsUrl: string;
  rating?: number | null;
  userRatingCount?: number | null;
  isOpen?: boolean | null;
}

export interface EmailActionData {
  to: string;
  subject: string;
  body: string;
  leadId?: string;
  leadName?: string;
}

export interface SearchFilters {
  category: string;
  location: string;
  businessName?: string;
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  leadsWithoutWebsite: number;
  interestedLeads: number;
  wonLeads: number;
  lostLeads: number;
}

