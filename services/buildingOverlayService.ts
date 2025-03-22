//services/buildingOverlayService.ts
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";

interface PolygonData {
  polygonid: string;
  coordinates: [number, number][];
}

class BuildingOverlayService {
  private polygons: PolygonData[] = [];
  private listeners: ((polygons: PolygonData[]) => void)[] = [];
  private map: L.Map | null = null;
  private polygonLayer: L.LayerGroup = L.layerGroup();

  // Set the map instance
  setMap(map: L.Map): void {
    this.map = map;
    this.polygonLayer.addTo(map);
  }

  // Get current polygons
  getPolygons(): PolygonData[] {
    return this.polygons;
  }

  async loadPolygons(projectId: string): Promise<number | void> {
    try {
      // Step 1: Check if the building footprint exists
      const statusResponse = await fetch(`/api/projects/${projectId}/building`);
      if (!statusResponse.ok) {
        alert("Building footprint not found.");
        return 404;
      }
  
      // Step 2: Fetch the polygon data
      const response = await fetch(
        `/api/projects/${projectId}/assets?action=serve&file=building/geo_polygon_definitions.json`
      );
      if (!response.ok) {
        alert(`Failed to fetch polygons: ${response.statusText}`)
        return 500;
      }
  
      const data: PolygonData[] = await response.json();
      this.setPolygons(data);
    } catch (error) {
      console.error("Error fetching polygons:", error);
    }
  }
  

  // Set polygons and update the map
  setPolygons(polygonData: PolygonData[]): void {
    this.polygons = polygonData;
    this.updateMap();
    this.notifyListeners();
  }

  // Notify components when polygons change
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.polygons));
  }

  // Add a listener to detect changes
  addListener(callback: (polygons: PolygonData[]) => void): void {
    this.listeners.push(callback);
  }

  // Remove a listener
  removeListener(callback: (polygons: PolygonData[]) => void): void {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  // Clear all polygons from the map
  clearPolygons(): void {
    this.polygonLayer.clearLayers();
    this.setPolygons([]);
  }

  // Update the map with interactive polygons
  private updateMap(): void {
    if (!this.map) return;
    this.polygonLayer.clearLayers();

    this.polygons.forEach((polygon) => {
      const latLngs: L.LatLngTuple[] = polygon.coordinates;
      const polygonLayer: L.Polygon = L.polygon(latLngs, {
        color: "blue",
        fillColor: "rgba(0, 0, 255, 0.3)",
        weight: 2,
      }).addTo(this.polygonLayer);

      // Attach polygon ID to the layer for persistence
      (polygonLayer as L.Polygon & { polygonid?: string }).polygonid = polygon.polygonid;

      // Enable leaflet-geoman editing
      polygonLayer.pm.enable();

      // Capture changes when polygon is edited
polygonLayer.on("pm:edit", async (event: L.LeafletEvent) => {
  const editedPolygon = event.target as L.Polygon & { polygonid?: string };
  const updatedCoordinates: [number, number][] = (editedPolygon.getLatLngs()[0] as L.LatLng[]).map((latlng) => [
    latlng.lat,
    latlng.lng,
  ]);

  const polygonId = editedPolygon.polygonid;
  if (!polygonId) return;

  // Update local polygon data
  const polygonIndex = this.polygons.findIndex((p) => p.polygonid === polygonId);
  if (polygonIndex !== -1) {
    this.polygons[polygonIndex].coordinates = updatedCoordinates;
    this.notifyListeners();
  }

  console.log(`Polygon ${polygonId} updated!`);

  // Send API request to update the file
  try {
    const response = await fetch(`/api/updatePolygons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        polygonId,
        updatedCoordinates,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to update geo_polygon_definitions.json`);
    }
  } catch (error) {
    console.error("Error updating geo_polygon_definitions.json:", error);
  }
});


      // **Click event: Show Edit/Delete buttons**
      polygonLayer.on("click", (event: L.LeafletMouseEvent) => {
        if (!this.map) return;

        this.map.eachLayer((layer) => {
          if (layer instanceof L.Popup) {
            this.map?.removeLayer(layer);
          }
        });

        L.popup()
          .setLatLng(event.latlng)
          .setContent(
            `<div style="padding: 10px;">
              <b>Polygon ID:</b> ${polygon.polygonid}<br/>
              <button id="editPolygon-${polygon.polygonid}" 
                style="padding: 6px 10px; margin-top: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Edit Polygon
              </button>
              <button id="deletePolygon-${polygon.polygonid}" 
                style="padding: 6px 10px; margin-top: 8px; background: red; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Delete Polygon
              </button>
            </div>`
          )
          .openOn(this.map);

        setTimeout(() => {
          const editButton = document.getElementById(`editPolygon-${polygon.polygonid}`);
          if (editButton) {
            editButton.addEventListener("click", () => {
              polygonLayer.pm.enable();
              this.map?.closePopup();
            });
          }

          const deleteButton = document.getElementById(`deletePolygon-${polygon.polygonid}`);
          if (deleteButton) {
            deleteButton.addEventListener("click", () => {
              this.deletePolygon(polygon.polygonid);
              this.map?.closePopup();
            });
          }
        }, 100);
      });

      // **Right Click - Show Only Polygon ID**
      polygonLayer.on("contextmenu", (event: L.LeafletMouseEvent) => {
        if (!this.map) return;

        this.map.eachLayer((layer) => {
          if (layer instanceof L.Popup) {
            this.map?.removeLayer(layer);
          }
        });

        L.popup()
          .setLatLng(event.latlng)
          .setContent(`<b>Polygon ID:</b> ${polygon.polygonid}`)
          .openOn(this.map);
      });
    });
  }

  // Delete a polygon
  deletePolygon(polygonid: string): void {
    this.polygonLayer.eachLayer((layer) => {
      const polygonLayer = layer as L.Polygon & { polygonid?: string };
      if (polygonLayer.polygonid === polygonid) {
        this.polygonLayer.removeLayer(polygonLayer);
      }
    });

    this.polygons = this.polygons.filter((polygon) => polygon.polygonid !== polygonid);
    this.notifyListeners();
  }
}

export const buildingOverlayService = new BuildingOverlayService();
