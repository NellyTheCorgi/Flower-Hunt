import { useState, useEffect, useRef } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin, useMap, useMapsLibrary, InfoWindow } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Icons } from '../constants';
import { useFirebase } from '../context/FirebaseContext';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
interface MapProps {
  onBack: () => void;
  onNavigate: (screen: any) => void;
}
const API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  import.meta.env.VITE_GOOGLE_API_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';
function MapContent({ onBack }: { onBack: () => void }) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<google.maps.places.Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.Place | null>(null);
  const { user } = useFirebase();
  const [flowers, setFlowers] = useState<any[]>([]);
  const [selectedFlower, setSelectedFlower] = useState<any | null>(null);
  const [markers, setMarkers] = useState<{[key: string]: google.maps.marker.AdvancedMarkerElement}>({});
  const clusterer = useRef<MarkerClusterer | null>(null);
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
  }, [map]);
  useEffect(() => {
    clusterer.current?.clearMarkers();
    clusterer.current?.addMarkers(Object.values(markers));
  }, [markers]);
  useEffect(() => {
    async function loadFlowers() {
      if (!user) return;
      const q = query(
        collection(db, 'collections'),
        where('userId', '==', user.uid)
      );
      try {
        const snap = await getDocs(q);
        const items: any[] = [];
        snap.forEach(doc => {
           const data = doc.data();
           if (data.location?.lat && data.location?.lng) {
              items.push({ id: doc.id, ...data });
           }
        });
        setFlowers(items);
        if (items.length > 0 && map) {
           map.panTo(items[0].location);
           map.setZoom(12);
        }
      } catch (err) {
        console.error('Failed to load flower map data', err);
      }
    }
    loadFlowers();
  }, [user, map]);
  const setMarkerRef = (marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => {
    if (marker && markers[id]) return;
    if (!marker && !markers[id]) return;
    setMarkers(prev => {
      if (marker) {
        return { ...prev, [id]: marker };
      } else {
        const next = { ...prev };
        delete next[id];
        return next;
      }
    });
  };
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!placesLib || !searchQuery) return;
    try {
      const { places: results } = await placesLib.Place.searchByText({
        textQuery: searchQuery,
        fields: ['displayName', 'location', 'formattedAddress', 'photos', 'editorialSummary', 'id'],
        locationBias: map?.getCenter(),
        maxResultCount: 8,
      });
      setPlaces(results);
      if (results.length > 0 && map && results[0].location) {
        map.panTo(results[0].location);
        map.setZoom(14);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };
  return (
    <>
      <GoogleMap
        defaultCenter={{ lat: 59.9139, lng: 10.7522 }} // Oslo center
        defaultZoom={12}
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100vh' }}
        disableDefaultUI={true}
        onClick={() => {
          setSelectedPlace(null);
          setSelectedFlower(null);
        }}
      >
        {flowers.map((flower) => (
          <AdvancedMarker
            key={`flower-${flower.id}`}
            position={flower.location}
            ref={(m) => setMarkerRef(m, `flower-${flower.id}`)}
            onClick={() => {
               setSelectedFlower(flower);
               setSelectedPlace(null);
            }}
            title={flower.speciesName}
          >
            <div className={`w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center p-1 border-2 border-primary transition-transform ${selectedFlower?.id === flower.id ? 'scale-125 z-10' : 'hover:scale-110'}`}>
               <img src={flower.imageUrl} alt={flower.speciesName} className="w-full h-full object-cover rounded-full" />
            </div>
          </AdvancedMarker>
        ))}
        {places.map((place) => (
          <AdvancedMarker
            key={`place-${place.id}`}
            position={place.location}
            ref={(m) => setMarkerRef(m, `place-${place.id}`)}
            onClick={() => {
               setSelectedPlace(place);
               setSelectedFlower(null);
            }}
            title={place.displayName || ''}
          >
            <Pin 
              background={selectedPlace?.id === place.id ? "#FBBC04" : "#34A853"} 
              glyphColor="#fff" 
              borderColor="#fff"
            />
          </AdvancedMarker>
        ))}
        {selectedFlower && selectedFlower.location && (
          <InfoWindow
            headerDisabled
            position={selectedFlower.location}
            onCloseClick={() => setSelectedFlower(null)}
          >
            <div className="p-2 max-w-[200px] flex flex-col gap-2">
              <h4 className="font-bold text-sm text-primary leading-tight">{selectedFlower.speciesName}</h4>
              <p className="text-[10px] text-muted-foreground font-medium">
                Funnet: {selectedFlower.collectedAt instanceof Timestamp ? selectedFlower.collectedAt.toDate().toLocaleDateString('no-NO') : new Date().toLocaleDateString('no-NO')}
              </p>
              <img 
                src={selectedFlower.imageUrl} 
                alt={selectedFlower.speciesName} 
                className="w-full h-24 object-cover rounded-lg shadow-sm"
              />
            </div>
          </InfoWindow>
        )}
        {selectedPlace && selectedPlace.location && (
          <InfoWindow
            headerDisabled
            position={selectedPlace.location}
            onCloseClick={() => setSelectedPlace(null)}
          >
            <div className="p-1 max-w-[200px]">
              <h4 className="font-bold text-sm text-primary mb-1">{selectedPlace.displayName}</h4>
              <p className="text-[10px] text-muted-foreground line-clamp-2">{selectedPlace.formattedAddress}</p>
              {selectedPlace.photos && selectedPlace.photos.length > 0 && (
                 <img 
                   src={selectedPlace.photos[0].getURI({ maxWidth: 200 })} 
                   alt={selectedPlace.displayName || ''} 
                   className="mt-2 w-full h-20 object-cover rounded-lg"
                 />
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      <header className="absolute top-0 left-0 right-0 z-10 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary pointer-events-auto active:scale-95 transition-transform shrink-0"
          >
            <Icons.ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <form onSubmit={handleSearch} className="flex-grow flex items-center bg-white rounded-2xl shadow-xl px-4 pointer-events-auto">
            <Icons.Search className="w-5 h-5 text-muted-foreground mr-2 shrink-0" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søk etter hager eller parker..."
              className="w-full py-3 bg-transparent text-sm focus:outline-none font-medium h-12"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="p-1 hover:bg-background rounded-full transition-colors"
              >
                <Icons.X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </form>
        </div>
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => {
              if (navigator.geolocation) {
                console.log('Forespør nåværende posisjon...');
                navigator.geolocation.getCurrentPosition((pos) => {
                  console.log('Posisjon funnet:', pos.coords);
                  if (map) {
                    map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    map.setZoom(15);
                  }
                }, (err) => {
                  console.warn('GPS-feil ved manuell sjekk:', err);
                  alert('Kunne ikke finne posisjonen din. Sjekk om stedstjenester er på.');
                });
              }
            }}
            className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-primary pointer-events-auto active:scale-95 transition-transform shrink-0"
            title="Finn min posisjon"
          >
            <Icons.Compass className="w-6 h-6" />
          </button>
          <div className="flex-grow flex gap-2 overflow-x-auto pb-2 pt-2 no-scrollbar pointer-events-auto">
            {['Botanisk hage', 'Naturreservat', 'Nasjonalpark', 'Blomstereng'].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSearchQuery(tag);
                handleSearch();
              }}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold shadow-md transition-all ${
                searchQuery === tag ? 'bg-primary text-white' : 'bg-white text-muted-foreground'
              }`}
            >
              {tag}
            </button>
          ))}
          </div>
        </div>
      </header>
      {/* Bottom floating panel for selected place */}
      {selectedPlace && (
        <div className="absolute bottom-8 left-8 right-8 z-10 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-[2rem] shadow-2xl border border-white/40 pointer-events-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-xl text-primary leading-tight">{selectedPlace.displayName}</h3>
                <p className="text-xs text-muted-foreground font-medium mt-1">{selectedPlace.formattedAddress}</p>
              </div>
              <button 
                onClick={() => setSelectedPlace(null)}
                className="p-2 hover:bg-background rounded-full transition-colors"
              >
                <Icons.X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            {selectedPlace.editorialSummary && (
              <p className="text-sm text-foreground/80 mb-6 leading-relaxed">
                {selectedPlace.editorialSummary}
              </p>
            )}
            <div className="flex gap-3">
              <button className="flex-grow bg-primary text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform shadow-lg shadow-primary/20">
                Veibeskrivelse
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default function Map({ onBack, onNavigate }: MapProps) {
  if (!hasValidKey) {
    return (
      <div className="h-screen w-full flex items-center justify-center p-6 bg-background">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-primary mb-4">Google API Nøkkel Mangler</h2>
          <p className="text-sm text-foreground mb-4">
            Du må legge til din Google Maps API-nøkkel i innstillingene (Secrets).
          </p>
          <button onClick={onBack} className="bg-primary text-white px-6 py-2 rounded-2xl">
            Tilbake
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="h-screen w-full relative bg-background">
      <APIProvider apiKey={API_KEY} version="weekly">
        <MapContent onBack={onBack} />
      </APIProvider>
    </div>
  );
}
