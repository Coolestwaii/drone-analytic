'use client';

export const dynamic = 'force-dynamic';

import React, { useRef, useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  LayersControl,
  FeatureGroup,
  Polygon,
  Popup,
  ImageOverlay,
  Marker,
} from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-geometryutil';
import html2canvas from 'html2canvas';
import { orthoOverlayService } from "@/services/orthoOverlayService";
import { buildingOverlayService } from '@/services/buildingOverlayService';
import { polygonOverlayService } from '@/services/polygonOverlayService';
import { cameraShotsService } from "@/services/cameraShotsService"; 

interface Polygon {
  _id: string;
  name: string;
  layerId: string;
  layer_id: string;
  color: string;
  coordinates: [number, number][];  
}

let addTempMarker: (coord: L.LatLngTuple,name:string) => void = () => {}; // Placeholder
let setSelectedLayerInMap: ((layerId: string | null, projectId: string | null, color: string | null) => void) | null = null;

const Map = ({ center }: { center: L.LatLngTuple }) => {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const selectedLayerRef = useRef<string | null>(null);
  const selectedProjectRef = useRef<string | null>(null);
  const selectedColorRef = useRef<string | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [drawControl,] = useState<L.Control.Draw | null>(null);

  const [polygons, setPolygons] = useState<{ polygonid: string; coordinates: L.LatLngTuple[] }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [overlay, setOverlay] = useState(orthoOverlayService.getOverlay());
  const [cameraShots, setCameraShots] = useState<{ id: string; filename:string; coordinates: L.LatLngTuple }[]>([]);
  const [tempMarkers, setTempMarkers] = useState<{ id: string; coordinates: L.LatLngTuple }[]>([]);
  const [layerPolygons, setLayerPolygons] = useState<{ 
    _id: string; 
    name: string; 
    layerId: string; 
    layer_id: string;
    color: string; 
    coordinates: L.LatLngTuple[] 
  }[]>([]);

  useEffect(() => {
    setSelectedLayerInMap = (layerId: string | null, projectId: string | null, color: string | null) => {      
      // Update state (for re-renders)
      setSelectedLayer(layerId);
      setSelectedProject(projectId);
      setSelectedColor(color);
  
      // Store latest values in refs
      selectedLayerRef.current = layerId;
      selectedProjectRef.current = projectId;
      selectedColorRef.current = color;
    };
  }, []);

  useEffect(() => {
    // Subscribe to changes in the overlay service
    const handleOverlayChange = (newOverlay: { imageUrl: string | null; bounds: L.LatLngBoundsExpression | null }) => {
      setOverlay(newOverlay);
  
      // If the overlay has valid bounds, adjust the zoom level
      if (mapRef.current && newOverlay.bounds) {
        mapRef.current.fitBounds(newOverlay.bounds, {
          maxZoom: 18, // Ensure max zoom for detailed viewing
          animate: true, // Smooth transition
          duration: 0.8, // Animation duration
        });
      }
    };
  
    orthoOverlayService.addListener(handleOverlayChange);
  
    return () => {
      orthoOverlayService.removeListener(handleOverlayChange);
    };
  }, []);
  
  
  useEffect(() => {
    // Update the map view when the center prop changes
    if (mapRef.current) {
      mapRef.current.setView(center, mapRef.current.getZoom(), {
        animate: true, // Smooth sliding animation
        duration: 0.8, // Duration of the animation in seconds
      });
    }
  }, [center]);

  useEffect(() => {
    if (mapRef.current) {
      cameraShotsService.setMap(mapRef.current);
      polygonOverlayService.setMap(mapRef.current);
    }
  }, []);

  useEffect(() => {
    const handleShotsChange = (newShots: { id: string; filename?: string; coordinates: L.LatLngTuple }[]) => {
      setCameraShots(newShots.map(shot => ({
        ...shot,
        filename: shot.filename || 'default_filename'
      })));
    };
  
    cameraShotsService.addListener(handleShotsChange);
    return () => cameraShotsService.removeListener(handleShotsChange);
  }, []);

  // Function to add temporary markers to the map
  addTempMarker = (coord: L.LatLngTuple) => {
    const newMarker = { id: `temp-${Date.now()}`, coordinates: coord };
    setTempMarkers((prevMarkers) => [...prevMarkers, newMarker]);

    // Remove the marker after 3 seconds
    setTimeout(() => {
      setTempMarkers((prevMarkers) => prevMarkers.filter(m => m.id !== newMarker.id));
    }, 3000);
  };

  // Listen for polygon updates from `buildingOverlayService`
  useEffect(() => {
    const handlePolygonChange = (newPolygons: { polygonid: string; coordinates: L.LatLngTuple[] }[]) => {
      setPolygons(newPolygons);
    };

    buildingOverlayService.addListener(handlePolygonChange);
    return () => buildingOverlayService.removeListener(handlePolygonChange);
  }, []);

  useEffect(() => {
    // Subscribe to Layer-Based Polygons updates (Record<string, PolygonData[]>)
    const handleLayerPolygonChange = (newPolygons: Record<string, { _id: string; name: string; layerId: string; layer_id: string; coordinates: L.LatLngTuple[]; color: string }[]>) => {
      const flattenedPolygons = Object.values(newPolygons).flat();
      setLayerPolygons(flattenedPolygons);
    };
    
    polygonOverlayService.addListener(handleLayerPolygonChange);
    return () => polygonOverlayService.removeListener(handleLayerPolygonChange);
  }, []);  

  useEffect(() => {
    L.drawLocal.draw.toolbar.buttons.polygon = "Draw a Custom Polygon";
    L.drawLocal.draw.toolbar.actions.title = "Cancel Drawing";
    L.drawLocal.draw.toolbar.actions.text = "❌ Cancel";
    L.drawLocal.draw.toolbar.finish.title = "Finish Drawing";
    L.drawLocal.draw.toolbar.finish.text = "✅ Finish";
    L.drawLocal.draw.toolbar.undo.title = "Delete Last Point";
    L.drawLocal.draw.toolbar.undo.text = "↩ Undo";
  }, []);

  const handleDownloadMap = async () => {
    if (!mapRef.current) return;
  
    const mapElement = mapRef.current.getContainer();
    const leafletPane = document.querySelector(".leaflet-pane"); // Captures Polygons & Overlays
  
    if (!leafletPane) {
      console.error("Leaflet pane not found!");
      return;
    }
  
    try {
      // Convert Map (Tile Layers)
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        logging: true,
        allowTaint: true,
        backgroundColor: null,
      });
  
      // Convert Polygons & Overlays (SVGs)
      const svgElements = leafletPane.querySelectorAll("svg");
      const svgData = new XMLSerializer().serializeToString(svgElements[0]);
  
      // Convert SVG to Base64 Image
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const svgImg = new Image();
      svgImg.src = svgUrl;
  
      svgImg.onload = () => {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(svgImg, 0, 0); // Merge the SVG into Canvas
        }
  
        // Download Image
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "map_snapshot.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
    } catch (error) {
      console.error("Error capturing map:", error);
    }
  };

  const handleDownloadGeoJSON = () => {
    if (polygons.length === 0 && layerPolygons.length === 0) {
      alert("No polygons available to download.");
      return;
    }
  
    const geojson = {
      type: "FeatureCollection",
      features: [
        ...polygons.map((polygon) => ({
          type: "Feature",
          properties: {
            polygonid: polygon.polygonid,
            source: "buildingOverlayService", // Identifies where this polygon came from
          },
          geometry: {
            type: "Polygon",
            coordinates: [polygon.coordinates.map(([lat, lng]) => [lng, lat])], // GeoJSON uses [lng, lat]
          },
        })),
        ...layerPolygons.map((polygon) => ({
          type: "Feature",
          properties: {
            id: polygon._id,
            name: polygon.name,
            layerId: polygon.layerId,
            color: polygon.color,
            source: "polygonOverlayService", // Identifies where this polygon came from
          },
          geometry: {
            type: "Polygon",
            coordinates: [polygon.coordinates.map(([lat, lng]) => [lng, lat])], // GeoJSON uses [lng, lat]
          },
        })),
      ],
    };
  
    // Convert JSON to Blob
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
  
    // Create a download link and trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = "polygons.geojson";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  
    // Cleanup URL object
    URL.revokeObjectURL(url);
  };

  const handleDownloadOrthophoto = () => {
    if (!overlay.imageUrl) {
      alert("No orthophoto available for download.");
      return;
    }
  
    // Create a hidden <a> tag to trigger download
    const link = document.createElement("a");
    link.href = overlay.imageUrl;
    link.download = "orthophoto.tif"; // Change file extension if needed
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'd') {
        // Only trigger if conditions are met (the polygon drawing option is enabled)
        if (selectedLayerRef.current && selectedProjectRef.current && selectedColorRef.current) {
          const polygonButton = document.querySelector('.leaflet-draw-draw-polygon') as HTMLElement;
          if (polygonButton) {
            polygonButton.click();
          } else {
            alert("Polygon drawing tool is not available.");
          }
        } else {
          alert("Please select a project, layer, and color before drawing a polygon.");
        }
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  return (
    <div className="h-full w-full relative z-0">
      <div className="relative">
        <button
          id="main-button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="absolute top-4 right-4 bg-white border border-gray-300 rounded-full shadow-md p-3 z-20"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-black"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l4 4h-3v6h-2v-6h-3l4-4zM6 14h12v2h-12v-2zm-2 4h16v2h-16v-2z" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute top-16 right-4 bg-white border border-gray-300 rounded-lg shadow-lg z-30">
            {/* Download Map Button */}
            <button
              onClick={handleDownloadMap}
              className="flex items-center space-x-2 w-full text-left px-4 py-3 hover:bg-gray-100 hover:rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-black"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M9 11v6h2v-4h2v4h2v-6h-6zM13 4v2h2l-3 3-3-3h2v-2h2zm-8 14v2h2l-3 3-3-3h2v-2h2zm16 0v2h2l-3 3-3-3h2v-2h2zm-10 4v2h2v-2h-2z" />
              </svg>
              <span>Download Map</span>
            </button>

            {/* Download GeoJSON Button */}
            <button
              onClick={handleDownloadGeoJSON}
              className="flex items-center space-x-2 w-full text-left px-4 py-3 hover:bg-gray-100 hover:rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-black"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l4 4h-3v6h-2v-6h-3l4-4zM6 14h12v2h-12v-2zm-2 4h16v2h-16v-2z" />
              </svg>
              <span>Download GeoJSON</span>
            </button>
            {/* Download Orthophoto */}
            <button
              onClick={handleDownloadOrthophoto}
              className="flex items-center rounded-lg space-x-2 w-full text-left px-4 py-3 hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-black"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3 10l9 9 9-9h-6V3h-6v7H3z" />
              </svg>
              <span>Download Overlay</span>
            </button>
          </div>
        )}
      </div>


      <MapContainer
        center={center || [40.74, -74.2]}
        zoom={18}
        minZoom={3}
        maxZoom={22}
        zoomControl={false}
        className="h-full w-full z-10"
        ref={mapRef}
      >
        <LayersControl position="bottomright">
          <LayersControl.BaseLayer checked name="Esri Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri"
              maxZoom={22}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Street View">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
              maxZoom={22}
            />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay checked name="Orthophoto Overlay">
            <ImageOverlay
              url={overlay.imageUrl || ''}
              bounds={overlay.bounds || [[0, 0], [0, 0]]}
              opacity={0.8}
              zIndex={1000}
            />
          </LayersControl.Overlay>
          {/* Blank White Tile */}
          <LayersControl.BaseLayer name="Blank White">
            <TileLayer
              url="https://placehold.co/256x256/FFFFFF/FFFFFF.png"
              attribution="&copy; Blank White"
              maxZoom={22}
            />
          </LayersControl.BaseLayer>

          {/* True Black Tile */}
          <LayersControl.BaseLayer name="Black Tile">
            <TileLayer
              url="https://placehold.co/256x256/000000/000000.png"
              attribution="&copy; Black Tile"
              maxZoom={22}
            />
          </LayersControl.BaseLayer>

        </LayersControl>

        <FeatureGroup ref={featureGroupRef}>
          {/* Render Polygons from buildingOverlayService */}
          {polygons.map((polygon, index) => (
            <Polygon 
              key={polygon.polygonid || `polygon-${index}`} // Fallback to index if ID is missing
              positions={polygon.coordinates} 
              pathOptions={{ color: "blue" }}
            >
              <Popup>
                <strong>Polygon ID:</strong> {polygon.polygonid || `polygon-${index}`}
              </Popup>
            </Polygon>
          ))}

          {/* Layer-Based Polygons (each layer has different colors) */}
          {layerPolygons.map((polygon) => {
            // Convert coordinates to L.LatLng instances
            const latLngs = polygon.coordinates.map(
              (coord) => L.latLng(coord[0], coord[1])
            );
            // Compute the area in square meters (using geodesicArea)
            const area =
              L.GeometryUtil && L.GeometryUtil.geodesicArea
                ? L.GeometryUtil.geodesicArea(latLngs)
                : 0;
            return (
              <Polygon
                key={polygon._id}
                positions={polygon.coordinates}
                pathOptions={{
                  color: polygon.color || "#FF0000", // Default to red if missing
                  fillColor: polygon.color || "#FFAAAA", // Lighter fill color
                  fillOpacity: 0.5,
                  weight: 2, // Border thickness
                }}
                ref={(layer) => {
                  if (layer) {
                    // Attach metadata to the layer object for later use if needed
                    (layer as L.Polygon & {
                      _id?: string;
                      layer_id?: string;
                      name?: string;
                    })._id = polygon._id;
                    (layer as L.Polygon & {
                      _id?: string;
                      layer_id?: string;
                      name?: string;
                    }).layer_id = polygon.layer_id;
                    (layer as L.Polygon & {
                      _id?: string;
                      layer_id?: string;
                      name?: string;
                    }).name = polygon.name;
                  }
                }}
              >
                <Popup>
                  <div>
                    <strong>Name:</strong> {polygon.name}
                  </div>
                  <div>
                    <strong>Area:</strong> {area.toFixed(2)} m²
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {cameraShots.map((shot) => (
            <Marker
              key={shot.id}
              position={shot.coordinates}
              icon={L.divIcon({
                className: "camera-marker",
                html: `<span style="font-size: 32px;">📷</span>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
              })}
            >
              <Popup>
                <strong>Coordinates</strong><br />
                Filename:{shot.filename}<br />
                Lat: {shot.coordinates[0]}<br />
                Lng: {shot.coordinates[1]}
              </Popup>
            </Marker>
          ))}

          {tempMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.coordinates}
              icon={L.divIcon({
                className: "temp-marker",
                html: `
                  <span style="
                    font-size: 32px;
                    display: inline-block;
                    opacity: 0;
                    transform: scale(0.5);
                    animation: fadeIn 0.5s ease-out forwards, bounce 0.6s ease-in-out infinite alternate, fadeOut 0.2s ease-out 2.8s forwards;
                  ">
                    🚩
                  </span>
                  <style>
                    @keyframes fadeIn {
                      from { opacity: 0; transform: scale(0.5); }
                      to { opacity: 1; transform: scale(1); }
                    }

                    @keyframes bounce {
                      from { transform: translateY(0); }
                      to { transform: translateY(-5px); }
                    }

                    @keyframes fadeOut {
                      from { opacity: 1; }
                      to { opacity: 0; transform: scale(0.5); }
                    }
                  </style>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
              })}
            />
          ))}

        <EditControl
          position="bottomright"
          draw={{
            rectangle: false,
            polyline: false,
            polygon: selectedLayer && selectedProject && selectedColor ? {
              shapeOptions: { 
                color: selectedColor, 
                fillColor: selectedColor, 
                fillOpacity: 0, 
                weight: 0, 
              } // Apply the selected layer color
            } : false, // Disable if any value is missing
            circle: false,
            marker: false,
            circlemarker: false,
          }}
          edit={{
            edit: true,
            remove: false,
          }}

          onDrawStart={() => {
            setIsPopupVisible(false); // Close pop-up when a new drawing starts
          }}
          onDrawStop={() => {
            setIsPopupVisible(false); // Close pop-up when drawing is canceled
          }}

          onCreated={async (e) => {
            // Ensure a polygon was drawn
            if (!(e.layer instanceof L.Polygon)) return;
          
            // Get latest values from refs
            const currentLayer = selectedLayerRef.current;
            const currentProject = selectedProjectRef.current;
            const currentColor = selectedColorRef.current;
          
            // Validate that all required variables are selected
            if (!currentLayer || !currentProject || !currentColor) {
              alert(`⚠️ Please select a project, layer, and color before drawing a polygon.`);
              return;
            }
          
            // Extract coordinates from the drawn polygon
            const latLngs = e.layer.getLatLngs();
            const coordinates = (latLngs[0] as L.LatLng[]).map((latlng) => [latlng.lat, latlng.lng]);
          
            // Prepare API request to create the new polygon
            try {
              const response = await fetch(`/api/projects/${currentProject}/polygon`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  layer_id: currentLayer,
                  coordinates: coordinates,
                }),
              });
          
              // Handle API response
              if (!response.ok) {
                throw new Error(`Failed to save polygon. Status: ${response.status}`);
              }
          
              const savedPolygon = await response.json();          

              // Emit signal so that PolygonToolbox refreshes polygons for currentLayer
              polygonOverlayService.emit("polygonCreated", { layerId: currentLayer, polygon: savedPolygon });
          
              // Disable drawing tools after shape is created
              if (drawControl) {
                mapRef.current?.removeControl(drawControl);
              }
          
            } catch (error) {
              console.error("❌ Error saving polygon:", error);
              alert("Failed to save polygon. Check console for details.");
            }
          }}

            
          />
  
          {isPopupVisible && (
            <div className="absolute top-4 right-4 bg-white p-3 rounded shadow-lg z-50 border border-gray-300">
              <p>Polygon Created!</p>
              <button 
                onClick={() => setIsPopupVisible(false)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Close Pop-up
              </button>
            </div>
          )}

        </FeatureGroup>

      </MapContainer>
    </div>
  );
};

export { setSelectedLayerInMap };
export { addTempMarker };
export default Map;
