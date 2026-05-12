"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  FeatureGroup,
  LayersControl,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L, { type LatLngLiteral } from "leaflet";
import "leaflet-draw";

type PolygonPoint = [number, number];

type LandMapProps = {
  location: LatLngLiteral | null;
  polygonPoints?: PolygonPoint[];
  onLocationChange: (lat: number, lng: number) => void;
  onPolygonChange: (points: PolygonPoint[] | null) => void;
};

const DEFAULT_CENTER: LatLngLiteral = { lat: 20.5937, lng: 78.9629 };
const DEFAULT_ZOOM = 5;
const FOCUSED_ZOOM = 15;

const TILE_SOURCES = {
  streets: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    name: "Esri World Imagery",
    url:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  },
};

const markerIconRetinaUrl =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const markerIconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const markerShadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIconRetinaUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
});

function normalizePolygonPoints(latLngs: L.LatLng[] | L.LatLng[][] | L.LatLng[][][]) {
  const flat = Array.isArray(latLngs[0]) ? (latLngs[0] as L.LatLng[]) : (latLngs as L.LatLng[]);
  return flat.map((point) => [point.lat, point.lng] as PolygonPoint);
}

function MapCenterer({ center, zoom }: { center: LatLngLiteral; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, map, zoom]);

  return null;
}

function LocationMarker({
  location,
  onLocationChange,
}: {
  location: LatLngLiteral | null;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (event) => {
      onLocationChange(event.latlng.lat, event.latlng.lng);
    },
  });

  if (!location) {
    return null;
  }

  const handleDragEnd = (event: L.DragEndEvent) => {
    const marker = event.target as L.Marker;
    const nextPosition = marker.getLatLng();
    onLocationChange(nextPosition.lat, nextPosition.lng);
  };

  return (
    <Marker
      position={location}
      draggable
      eventHandlers={{ dragend: handleDragEnd }}
    >
      <Popup>Land location</Popup>
    </Marker>
  );
}

export default function LandMap({
  location,
  polygonPoints,
  onLocationChange,
  onPolygonChange,
}: LandMapProps) {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const hasPolygon = Boolean(polygonPoints && polygonPoints.length >= 3);
  const center = useMemo(() => location ?? DEFAULT_CENTER, [location]);
  const zoom = location ? FOCUSED_ZOOM : DEFAULT_ZOOM;

  const handleCreated = (event: L.DrawEvents.Created) => {
    if (event.layerType !== "polygon") {
      return;
    }

    const featureGroup = featureGroupRef.current;
    if (featureGroup) {
      featureGroup.eachLayer((layer) => {
        if (layer !== event.layer) {
          featureGroup.removeLayer(layer);
        }
      });
    }

    const points = normalizePolygonPoints(
      (event.layer as L.Polygon).getLatLngs(),
    );
    onPolygonChange(points);
  };

  const handleEdited = (event: L.DrawEvents.Edited) => {
    let updated: PolygonPoint[] | null = null;
    event.layers.eachLayer((layer) => {
      if (!updated && layer instanceof L.Polygon) {
        updated = normalizePolygonPoints(layer.getLatLngs());
      }
    });

    onPolygonChange(updated);
  };

  const handleDeleted = () => {
    onPolygonChange(null);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-72 w-full"
        scrollWheelZoom
      >
        <MapCenterer center={center} zoom={zoom} />
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name={TILE_SOURCES.streets.name}>
            <TileLayer
              attribution={TILE_SOURCES.streets.attribution}
              url={TILE_SOURCES.streets.url}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name={TILE_SOURCES.satellite.name}>
            <TileLayer
              attribution={TILE_SOURCES.satellite.attribution}
              url={TILE_SOURCES.satellite.url}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            onCreated={handleCreated}
            onEdited={handleEdited}
            onDeleted={handleDeleted}
            draw={{
              polyline: false,
              rectangle: false,
              circle: false,
              circlemarker: false,
              marker: false,
              polygon: {
                allowIntersection: false,
                showArea: true,
              },
            }}
          />
          {hasPolygon && (
            <Polygon positions={polygonPoints as PolygonPoint[]} pathOptions={{ color: "#2f7a58" }} />
          )}
        </FeatureGroup>

        <LocationMarker location={location} onLocationChange={onLocationChange} />
      </MapContainer>
    </div>
  );
}
