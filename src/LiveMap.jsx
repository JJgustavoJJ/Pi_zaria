import { useEffect, useRef, useState } from "react";

let mapsPromise;
function loadGoogleMaps() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error("Configure VITE_GOOGLE_MAPS_API_KEY no arquivo .env."));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (!mapsPromise) {
    mapsPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-pz-google-maps]');
      if (existing) { existing.addEventListener("load", () => resolve(window.google.maps)); existing.addEventListener("error", reject); return; }
      const script = document.createElement("script");
      script.dataset.pzGoogleMaps = "true";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
      script.async = true; script.defer = true;
      script.onload = () => resolve(window.google.maps);
      script.onerror = () => reject(new Error("Não foi possível carregar o Google Maps."));
      document.head.appendChild(script);
    });
  }
  return mapsPromise;
}

export default function LiveMap({ position, destination, destinationAddress }) {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const driverMarker = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    loadGoogleMaps().then((maps) => {
      if (!active || !mapElement.current) return;
      const center = { lat: Number(position.lat), lng: Number(position.lng) };
      if (!mapRef.current) {
        mapRef.current = new maps.Map(mapElement.current, { center, zoom: 15, mapTypeControl: false, streetViewControl: false, fullscreenControl: true });
      } else mapRef.current.setCenter(center);
      if (!driverMarker.current) driverMarker.current = new maps.Marker({ map: mapRef.current, position: center, title: "Motoboy" });
      else driverMarker.current.setPosition(center);
      if (destination && Number.isFinite(Number(destination.lat)) && Number.isFinite(Number(destination.lng))) {
        const dest = { lat: Number(destination.lat), lng: Number(destination.lng) };
        new maps.Marker({ map: mapRef.current, position: dest, title: "Destino" });
      }
    }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [position.lat, position.lng, destination?.lat, destination?.lng]);

  return <div className="pz-map-card">
    <div className="pz-map-heading">Localização do motoboy</div>
    {error ? <div className="pz-map-message">{error} {destinationAddress || ""}</div> : <div ref={mapElement} className="pz-live-map" aria-label="Mapa com localização do motoboy" />}
  </div>;
}
