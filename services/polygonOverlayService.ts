// services/polygonOverlayService.ts
import L from "leaflet";

export interface PolygonData {
  _id: string;
  name: string;
  layerId: string;
  layer_id: string;
  color: string;
  coordinates: [number, number][];
}

const visibleByDefault = true;

class PolygonOverlayService {
  private polygons: Record<string, PolygonData[]> = {}; // Store polygons per layer
  private listeners: ((polygons: Record<string, PolygonData[]>) => void)[] = [];
  private map: L.Map | null = null;
  private polygonLayers: Record<string, L.LayerGroup> = {}; // Separate LayerGroups per layer
  private markerLayer: L.LayerGroup = L.layerGroup();
  private visibility: Record<string, boolean> = {};
  private eventListeners: Record<string, ((payload: unknown) => void)[]> = {};

  // Set the Leaflet map instance
  setMap(map: L.Map): void {
    this.map = map;
    this.markerLayer.addTo(map);
  }

  // Get all polygons for a specific layer
  getPolygons(layerId: string): PolygonData[] {
    return this.polygons[layerId] || [];
  }

  // Load polygons from API (only fetch for a specific layer)
  async loadPolygons(projectId: string, layerId: string): Promise<void> {
    try {
      const response = await fetch(`/api/projects/${projectId}/polygon?layer_id=${layerId}`);
      if (!response.ok) throw new Error("Failed to fetch polygons");

      const data: PolygonData[] = await response.json();
      this.setPolygons(layerId, data);
    } catch (error) {
      console.error(`Error fetching polygons for layer ${layerId}:`, error);
    }
  }

  // Set and update polygons per layer
  setPolygons(layerId: string, polygonData: PolygonData[]): void {
    this.polygons[layerId] = polygonData;
    // Only set default if not already defined:
    if (this.visibility[layerId] === undefined) {
      this.visibility[layerId] = visibleByDefault;
    }
    // Only update the map if the layer is visible:
    if (this.visibility[layerId]) {
      this.updateMap(layerId);
    } else {
      this.hideLayerPolygons(layerId);
    }
    this.notifyListeners();
  }

  // Notify listeners when polygons change
  private notifyListeners(): void {
    const visiblePolygons: Record<string, PolygonData[]> = {};
    for (const layerId in this.polygons) {
      visiblePolygons[layerId] =
        this.visibility[layerId] === false ? [] : this.polygons[layerId];
    }
    this.listeners.forEach((callback) => callback(visiblePolygons));
  }

  // Add a listener for polygons update
  addListener(callback: (polygons: Record<string, PolygonData[]>) => void): void {
    this.listeners.push(callback);
  }

  // Remove a listener for polygons update
  removeListener(callback: (polygons: Record<string, PolygonData[]>) => void): void {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  hideLayerPolygons(layer_id: string): void {
    if (!this.map || !this.polygonLayers[layer_id]) return;

    this.visibility[layer_id] = false;
    this.polygonLayers[layer_id].eachLayer((layer) => {
      this.map?.removeLayer(layer);
    });
    this.polygonLayers[layer_id].clearLayers();
    this.notifyListeners();
  }

  // Delete a polygon from a specific layer
  deletePolygon(layerId: string, _id: string): void {
    if (!this.polygonLayers[layerId]) return;

    this.polygonLayers[layerId].eachLayer((layer) => {
      const polygonLayer = layer as L.Polygon & { _id?: string };
      if (polygonLayer._id === _id) {
        this.polygonLayers[layerId].removeLayer(polygonLayer);
      }
    });
    this.polygons[layerId] = this.polygons[layerId].filter((p) => p._id !== _id);
    this.notifyListeners();
  }

  // Remove all polygons of a specific layer (when collapsed)
  removeLayerPolygons(layer_id: string): void {
    if (!this.map || !this.polygonLayers[layer_id]) return;
    if (this.map.hasLayer(this.polygonLayers[layer_id])) {
      this.map.removeLayer(this.polygonLayers[layer_id]);
    }
    this.notifyListeners();
  }

  highlightPolygon(polygon: PolygonData): void {
    if (!this.map) {
      console.warn("🚨 Map is not set in PolygonOverlayService yet!");
      return;
    }
    if (!polygon.coordinates.length) return;

    let targetPolygonLayer: L.Polygon | null = null;
    Object.values(this.polygonLayers).forEach((layerGroup) => {
      layerGroup.eachLayer((layer) => {
        const polygonLayer = layer as L.Polygon & { _id?: string };
        if (polygonLayer._id === polygon._id) {
          targetPolygonLayer = polygonLayer;
        }
      });
    });

    if (!targetPolygonLayer) {
      console.warn(`⚠️ Polygon ${polygon.name} (${polygon._id}) not found in any layer.`);
      return;
    }

    const polygonLayer = targetPolygonLayer as L.Polygon;
    const originalStyle = {
      color: (polygonLayer.options.color as string) || polygon.color || "#3388ff",
      fillColor: (polygonLayer.options.fillColor as string) || polygon.color || "rgba(51, 136, 255, 0.3)",
      weight: (polygonLayer.options.weight as number) || 2,
    };

    polygonLayer.setStyle({
      color: "#FFD700",
      fillColor: "#FFFF99",
      weight: 6,
    });
    setTimeout(() => {
      polygonLayer.setStyle(originalStyle);
    }, 3000);
  }

  // Update the Leaflet map with polygons of a specific layer
  private updateMap(layerId: string): void {
    if (!this.map) return;
  
    // Remove existing layer group for this layer if it exists
    if (this.polygonLayers[layerId] && this.map.hasLayer(this.polygonLayers[layerId])) {
      this.map.removeLayer(this.polygonLayers[layerId]);
      delete this.polygonLayers[layerId];
    }
  
    // Create a new layer group and add it to the map
    this.polygonLayers[layerId] = L.layerGroup().addTo(this.map);
    const layerGroup = this.polygonLayers[layerId];
    layerGroup.clearLayers();
  
    this.polygons[layerId]?.forEach((polygon) => {
      const latLngs: L.LatLngTuple[] = polygon.coordinates;
      const polygonLayer = L.polygon(latLngs, {
        color: "blue",
        fillColor: "rgba(0, 0, 255, 0.3)",
        weight: 2,
      }).addTo(layerGroup) as L.Polygon & { _id?: string };
      polygonLayer._id = polygon._id;
    });
  }
  

  emit(eventName: string, payload: unknown): void {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName].forEach((callback) => callback(payload));
    }
  }

  addEventListener(eventName: string, callback: (payload: unknown) => void): void {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    this.eventListeners[eventName].push(callback);
  }

  removeEventListener(eventName: string, callback: (payload: unknown) => void): void {
    if (!this.eventListeners[eventName]) return;
    this.eventListeners[eventName] = this.eventListeners[eventName].filter(
      (cb) => cb !== callback
    );
  }
}

export const polygonOverlayService = new PolygonOverlayService();
