/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  MapContainer,
  TileLayer,
  LayersControl,
  FeatureGroup,
} from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import 'leaflet-draw/dist/leaflet.draw.css'; // Import Leaflet Draw CSS
import L from 'leaflet';
import 'leaflet-geometryutil';

// TypeScript interface for leaflet events
interface LeafletEvent {
  layerType: string;
  layer: L.Layer;
}

// Map Component
const Map = () => {
  // Handle shape creation (polygon, polyline, etc.)
  const _onCreated = (e: any) => {
    const { layerType, layer } = e;
    const latlngs = layer.getLatLngs();

    if (layerType === 'polyline') {
      // Calculate distance for polylines
      const totalDistance = L.GeometryUtil.length(layer);
      console.log(
        `Created Polyline with total distance: ${totalDistance.toFixed(2)} meters`
      );
      layer
        .bindPopup(`Total distance: ${totalDistance.toFixed(2)} meters`)
        .openPopup();
    } else if (layerType === 'polygon') {
      //@ts-ignore
      const area = L.GeometryUtil.geodesicArea(latlngs[0]);
      console.log(
        `Created Polygon with area: ${area.toFixed(2)} square meters`
      );
      layer.bindPopup(`Area: ${area.toFixed(2)} square meters`).openPopup();
    } else if (layerType === 'circle') {
      // Display the radius for circles
      const radius = layer.getRadius();
      console.log(`Created Circle with radius: ${radius.toFixed(2)} meters`);
      layer.bindPopup(`Radius: ${radius.toFixed(2)} meters`).openPopup();
    } else if (layerType === 'marker') {
      // Show the coordinates for marker
      const { lat, lng } = layer.getLatLng();
      console.log(`Created Marker at coordinates: [${lat}, ${lng}]`);
      layer
        .bindPopup(`Coordinates: [${lat.toFixed(6)}, ${lng.toFixed(6)}]`)
        .openPopup();
    }
  };

  // Handle shape editing
  const _onEdited = (e: any) => {
    let editedLayers = 0;
    e.layers.eachLayer((layer: any) => {
      editedLayers += 1;
    });
    console.log(`Edited ${editedLayers} layers`);
  };

  // Handle shape deletion
  const _onDeleted = (e: any) => {
    let deletedLayers = 0;
    e.layers.eachLayer((layer: any) => {
      deletedLayers += 1;
    });
    console.log(`Deleted ${deletedLayers} layers`);
  };

  return (
    <div className="h-full w-full z-0">
      {/* MapContainer initializes the Leaflet map */}
      <MapContainer
        center={[18.8051206, 98.9507674]}
        zoom={20}
        zoomControl={false}
        className="h-full w-full"
      >
        {/* LayersControl allows switching between different map views */}
        <LayersControl position="bottomright">
          {/* Street View layer */}
          <LayersControl.BaseLayer checked name="Street View">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>

          {/* Satellite View layer (checked by default) */}
          <LayersControl.BaseLayer name="Satellite View">
            <TileLayer
              url="https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.png"
              attribution='&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        {/* FeatureGroup for drawing controls */}
        <FeatureGroup>
          <EditControl
            position="bottomright"
            onCreated={_onCreated}
            onEdited={_onEdited}
            onDeleted={_onDeleted}
            draw={{
              rectangle: false, // Disable rectangle drawing
              polyline: true,
              polygon: true,
              circle: true,
              marker: true,
              circlemarker: false, // Disable circle marker drawing
            }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
};

export default Map;
