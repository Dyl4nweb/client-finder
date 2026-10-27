-- ==============================================================================
-- Client Finder: Supabase PostgreSQL Database Schema
-- ==============================================================================
-- Run this SQL in your Supabase Project's SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 2. Create the 'leads' table
create table if not exists public.leads (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    business_name text not null,
    category text,
    address text,
    phone text,
    website_url text,
    google_maps_url text,
    external_place_id text,
    status text not null default 'New' check (status in ('New', 'Contacted', 'Interested', 'Won', 'Lost')),
    notes text default '',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create indexes for performance and search
create index if not exists idx_leads_user_id on public.leads(user_id);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_created_at on public.leads(created_at desc);

-- 4. Unique constraint to prevent duplicate saved leads per user
create unique index if not exists idx_leads_user_external_place 
on public.leads (user_id, external_place_id) 
where external_place_id is not null;

-- 5. Enable Row Level Security (RLS)
-- NOTE: If you are using the app with PIN code without a Supabase auth login,
-- you can run this single command to disable RLS if you encounter row-level security insert errors:
-- ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
alter table public.leads enable row level security;

-- 6. RLS Policies: Allow users to view and manage leads
drop policy if exists "Users can view their own leads" on public.leads;
drop policy if exists "Users can insert their own leads" on public.leads;
drop policy if exists "Users can update their own leads" on public.leads;
drop policy if exists "Users can delete their own leads" on public.leads;
drop policy if exists "Users can view leads" on public.leads;
drop policy if exists "Users can insert leads" on public.leads;
drop policy if exists "Users can update leads" on public.leads;
drop policy if exists "Users can delete leads" on public.leads;

create policy "Users can view leads"
    on public.leads for select
    using (auth.uid() = user_id or user_id is null);

create policy "Users can insert leads"
    on public.leads for insert
    with check (auth.uid() = user_id or user_id is null);

create policy "Users can update leads"
    on public.leads for update
    using (auth.uid() = user_id or user_id is null);

create policy "Users can delete leads"
    on public.leads for delete
    using (auth.uid() = user_id or user_id is null);

-- 7. Trigger to automatically update updated_at on record change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
    before update on public.leads
    for each row
    execute function public.handle_updated_at();

-- ==============================================================================
-- Schema setup complete!
-- ==============================================================================

-- ==============================================================================
-- OPTIONAL: Auto-Confirm User Email (Fixes "Email not confirmed" error)
-- ==============================================================================
-- Run this in your Supabase SQL Editor to instantly verify your user account:
update auth.users
set email_confirmed_at = now()
where email_confirmed_at is null;

