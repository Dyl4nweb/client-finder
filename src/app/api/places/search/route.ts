import { NextRequest, NextResponse } from 'next/server';
import { PlaceResult } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || '';
  const location = searchParams.get('location') || '';
  const businessName = searchParams.get('name') || '';

  if (!location.trim()) {
    return NextResponse.json(
      { configured: true, places: [], error: 'Please enter a city or location to search.' },
      { status: 400 }
    );
  }

  // Check if Google Places API Key is provided
  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY;

  const isGoogleKeyConfigured = Boolean(
    apiKey &&
    !apiKey.includes('AIzaSy...') &&
    apiKey.trim().length > 10
  );

  const queryParts = [businessName.trim(), category.trim(), `in ${location.trim()}`].filter(Boolean);
  const textQuery = queryParts.join(' ');

  // 1. If Google API Key is provided, use Google Places API
  if (isGoogleKeyConfigured) {
    try {
      const placesNewResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey as string,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount,places.primaryTypeDisplayName,places.types,places.regularOpeningHours',
        },
        body: JSON.stringify({
          textQuery,
          pageSize: 20,
        }),
      });

      if (placesNewResponse.ok) {
        const data = await placesNewResponse.json();
        const rawPlaces = data.places || [];

        interface GooglePlaceNew {
          id: string;
          displayName?: { text?: string };
          formattedAddress?: string;
          nationalPhoneNumber?: string;
          internationalPhoneNumber?: string;
          websiteUri?: string;
          googleMapsUri?: string;
          rating?: number;
          userRatingCount?: number;
          primaryTypeDisplayName?: { text?: string };
          types?: string[];
          regularOpeningHours?: { openNow?: boolean };
        }

        const places: PlaceResult[] = rawPlaces.map((p: GooglePlaceNew) => ({
          id: p.id,
          name: p.displayName?.text || 'Business Name Unavailable',
          category: p.primaryTypeDisplayName?.text || category,
          address: p.formattedAddress || location,
          phone: p.nationalPhoneNumber || p.internationalPhoneNumber || '',
          website: p.websiteUri || '',
          googleMapsUrl:
            p.googleMapsUri ||
            (p.id
              ? `https://www.google.com/maps/place/?q=place_id:${p.id}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textQuery)}`),
          rating: p.rating ?? null,
          userRatingCount: p.userRatingCount ?? null,
          isOpen: p.regularOpeningHours?.openNow ?? null,
        }));

        return NextResponse.json({
          configured: true,
          provider: 'Google Places API',
          places,
          total: places.length,
        });
      }
    } catch (err) {
      console.warn('Google Places error, falling back to Free OpenStreetMap:', err);
    }
  }

  // 2. 100% FREE Provider: OpenStreetMap Nominatim API (Zero Payment, Zero Credit Card Required!)
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      textQuery
    )}&format=json&addressdetails=1&extratags=1&limit=25`;

    const osmResponse = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'ClientFinderApp/1.0 (contact: support@clientfinder.local)',
        Accept: 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (osmResponse.ok) {
      interface OsmPlace {
        place_id: number;
        osm_type?: string;
        osm_id?: number;
        lat: string;
        lon: string;
        name?: string;
        display_name: string;
        type?: string;
        class?: string;
        extratags?: {
          phone?: string;
          'contact:phone'?: string;
          website?: string;
          'contact:website'?: string;
          opening_hours?: string;
        };
      }

      const osmData: OsmPlace[] = await osmResponse.json();

      const places: PlaceResult[] = osmData.map((item) => {
        const businessNameClean = item.name || item.display_name.split(',')[0];
        const phone = item.extratags?.phone || item.extratags?.['contact:phone'] || '';
        const website = item.extratags?.website || item.extratags?.['contact:website'] || '';
        const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          businessNameClean
        )}+${item.lat},${item.lon}`;

        return {
          id: `osm_${item.osm_type || 'node'}_${item.osm_id || item.place_id}`,
          name: businessNameClean,
          category: item.type ? item.type.replace('_', ' ') : category,
          address: item.display_name,
          phone,
          website,
          googleMapsUrl: gmapsUrl,
          rating: null,
          userRatingCount: null,
          isOpen: null,
        };
      });

      return NextResponse.json({
        configured: true,
        provider: 'OpenStreetMap (100% Free Live Discovery)',
        places,
        total: places.length,
      });
    }

    return NextResponse.json(
      {
        configured: true,
        places: [],
        error: 'No businesses found for this location. Please try another city or category.',
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Free Business Search Error:', err);
    return NextResponse.json(
      {
        configured: true,
        places: [],
        error: 'Unable to connect to the business discovery service. Please try again.',
      },
      { status: 500 }
    );
  }
}
