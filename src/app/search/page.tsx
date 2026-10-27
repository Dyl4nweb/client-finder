'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLeads } from '@/context/LeadsContext';
import { PlaceResult } from '@/types';
import {
  Search,
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  Star,
  Check,
  BookmarkPlus,
  AlertCircle,
  HelpCircle,
  Key,
  Building2,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { VarexAvatar } from '@/components/assistant/VarexAvatar';

const POPULAR_CATEGORIES = [
  'Cafés',
  'Restaurants',
  'Salons',
  'Clinics',
  'Local Shops',
  'Dentists',
  'Gyms & Fitness',
  'Plumbers',
  'Bakeries',
];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'Cafés';
  const initialLocation = searchParams.get('location') || '';

  const { saveLead, isPlaceSaved } = useLeads();

  const [category, setCategory] = useState(initialCategory);
  const [location, setLocation] = useState(initialLocation);
  const [businessName, setBusinessName] = useState('');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [provider, setProvider] = useState<string>('Free Live Discovery');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [savingPlaceId, setSavingPlaceId] = useState<string | null>(null);
  const [searchSummary, setSearchSummary] = useState('');

  // Synchronize when URL searchParams change
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      const formatted = cat.charAt(0).toUpperCase() + cat.slice(1);
      setCategory(formatted);
    }
    const loc = searchParams.get('location');
    if (loc) {
      setLocation(loc);
    }
  }, [searchParams]);

  const executeSearch = async () => {
    const locQuery = location.trim();

    if (!locQuery) {
      setErrorMessage('Please enter a city or location to search.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        category: category.toLowerCase(),
        location: locQuery,
      });

      if (businessName.trim()) {
        params.append('name', businessName.trim());
      }

      const res = await fetch(`/api/places/search?${params.toString()}`);
      const data = await res.json();

      setIsConfigured(data.configured ?? true);
      if (data.provider) {
        setProvider(data.provider);
      }

      if (data.error) {
        setErrorMessage(data.error);
        setResults([]);
      } else {
        setResults(data.places || []);
        setSearchSummary(
          `${category} in ${locQuery}${businessName ? ` matching "${businessName}"` : ''}`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to search places';
      setErrorMessage(msg);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const handleSaveLead = async (place: PlaceResult) => {
    setSavingPlaceId(place.id);
    const suggestedEmail = place.email || (place.website ? `contact@${place.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')}` : `contact@${place.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`);

    try {
      await saveLead({
        business_name: place.name,
        category: place.category || category,
        address: place.address || '',
        phone: place.phone || '',
        email: suggestedEmail,
        website_url: place.website || '',
        google_maps_url: place.googleMapsUrl || '',
        external_place_id: place.id,
        status: 'New',
        notes: place.website
          ? 'Saved prospect from search.'
          : 'High Opportunity: No website listed on Google Maps profile. Candidate for custom website build.',
      });
    } catch (err) {
      console.error('Error saving lead:', err);
    } finally {
      setSavingPlaceId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-neutral-900">
          Find Real Businesses & Clients
        </h1>
        <p className="text-xs md:text-sm text-neutral-500 mt-1">
          Search real local establishments via Google Places to find companies that need modern websites.
        </p>
      </div>

      {/* Search Form Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Business Category
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-neutral-900 border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 shadow-2xs cursor-pointer"
                >
                  {POPULAR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location (City / Area) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                City or Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Austin, TX or Miami, FL"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs text-neutral-900 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 shadow-2xs"
                />
              </div>
            </div>

            {/* Optional Business Name */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Business Name <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Daily Grind or Blue"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs text-neutral-900 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-neutral-400 mr-1">Quick categories:</span>
            {['Cafés', 'Salons', 'Clinics', 'Restaurants', 'Local Shops'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer ${
                  category === cat
                    ? 'bg-neutral-900 text-white border-neutral-900 font-medium'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Submit & Demo buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-100">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <VarexAvatar size="xs" />
              <span>Identifies businesses missing modern websites</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching Google Places...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Real Businesses</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold">Search Error</p>
            <p className="mt-0.5 text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3 animate-pulse shadow-2xs"
            >
              <div className="h-4 bg-neutral-200 rounded w-2/3" />
              <div className="h-3 bg-neutral-100 rounded w-1/3" />
              <div className="h-3 bg-neutral-100 rounded w-full" />
              <div className="h-8 bg-neutral-100 rounded w-full mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Results Header */}
      {!loading && results.length > 0 && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Search Results
            </h2>
            <p className="text-xs text-neutral-600 mt-0.5">
              Found <strong className="font-semibold text-neutral-900">{results.length}</strong> businesses for {searchSummary}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-700 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-full shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium">{provider}</span>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((place) => {
            const alreadySaved = isPlaceSaved(place.id);
            const isSaving = savingPlaceId === place.id;
            const hasWebsite = Boolean(place.website && place.website.trim() !== '');

            return (
              <div
                key={place.id}
                className={`bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col justify-between shadow-xs hover:border-neutral-300 transition-colors ${
                  alreadySaved ? 'border-neutral-300 bg-neutral-50/60' : ''
                }`}
              >
                <div>
                  {/* Top Bar: Category & Rating */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                      {place.category || category}
                    </span>
                    {place.rating !== null && place.rating !== undefined && (
                      <div className="flex items-center gap-1 text-xs text-neutral-700 font-medium">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{place.rating.toFixed(1)}</span>
                        {place.userRatingCount ? (
                          <span className="text-[10px] text-neutral-400">
                            ({place.userRatingCount})
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Business Name */}
                  <h3 className="text-sm font-semibold text-neutral-900 mt-2.5 leading-snug">
                    {place.name}
                  </h3>

                  {/* Address */}
                  <div className="flex items-start gap-1.5 text-xs text-neutral-500 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                    <span>{place.address}</span>
                  </div>

                  {/* Phone */}
                  {place.phone ? (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 mt-1.5">
                      <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <a href={`tel:${place.phone}`} className="hover:text-neutral-900 font-mono">
                        {place.phone}
                      </a>
                    </div>
                  ) : null}

                  {/* Customer Contact Email */}
                  {(() => {
                    const customerEmail = place.email || (place.website ? `contact@${place.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')}` : `contact@${place.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`);
                    return (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600 mt-1.5">
                        <Mail className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                        <span className="font-mono text-[11px] text-neutral-800 font-medium truncate" title={`Potential customer email: ${customerEmail}`}>
                          {customerEmail}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Website Badge / Link */}
                  <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="text-neutral-500 text-[11px]">Web Presence:</span>
                    {hasWebsite ? (
                      <a
                        href={place.website.startsWith('http') ? place.website : `https://${place.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-neutral-800 hover:text-neutral-950 font-medium hover:underline text-[11px]"
                      >
                        <Globe className="w-3 h-3 text-neutral-400" />
                        <span className="truncate max-w-[150px]">
                          {place.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </span>
                        <ExternalLink className="w-2.5 h-2.5 text-neutral-400" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        <span>No Website Listed</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {place.googleMapsUrl && (
                      <a
                        href={place.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1"
                        title="View on Google Maps"
                      >
                        <span>Maps</span>
                        <ExternalLink className="w-3 h-3 text-neutral-400" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const customerEmail = place.email || (place.website ? `contact@${place.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')}` : `contact@${place.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`);
                        window.dispatchEvent(
                          new CustomEvent('open-varex-ai', {
                            detail: {
                              lead: {
                                id: place.id,
                                business_name: place.name,
                                category: category,
                                address: place.address,
                                phone: place.phone,
                                email: customerEmail,
                                website_url: place.website,
                              },
                              prompt: `Draft a personalized outreach email to ${place.name} at ${customerEmail}.`,
                            },
                          })
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                      title="Get AI pitch strategy from Varex AI (Engineered by Dylan Ramos • https://dylanramos.site)"
                    >
                      <VarexAvatar size="xs" />
                      <span>Varex Pitch</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveLead(place)}
                    disabled={alreadySaved || isSaving}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-xs ${
                      alreadySaved
                        ? 'bg-neutral-100 text-neutral-500 border border-neutral-200 cursor-not-allowed'
                        : 'bg-neutral-900 text-white hover:bg-neutral-800'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : alreadySaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Saved to Leads</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Save Lead</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Initial Empty State before any search */}
      {!hasSearched && (
        <div className="p-12 bg-white rounded-xl border border-neutral-200 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-900">
            Search for local businesses in your target city
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
            Choose a business category (e.g. Cafés, Salons, Clinics, or Shops), enter a city or postal area, and find potential clients to reach out to.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-neutral-500">
          Loading Search...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
