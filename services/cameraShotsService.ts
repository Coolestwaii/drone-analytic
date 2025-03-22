//services/cameraShotsService.ts
import L from "leaflet";

interface CameraShot {
  id: string;
  filename?: string;
  coordinates: L.LatLngTuple;
}

class CameraShotsService {
  private shots: CameraShot[] = [];
  private listeners: ((shots: CameraShot[]) => void)[] = [];
  private map: L.Map | null = null;
  private markerLayer: L.LayerGroup = L.layerGroup();

  // Set the map instance
  setMap(map: L.Map): void {
    this.map = map;
    this.markerLayer.addTo(map);
  }

  // Load shots from API and set markers
  async loadShotsFromApi(projectId: string): Promise<void> {
    try {
      const response = await fetch(`/api/projects/${projectId}/assets?action=serve&file=odm_report/shots.geojson`);
      if (!response.ok) throw new Error(`Failed to fetch shots: ${response.statusText}`);

      const data = await response.json();
      const cameraShots = data.features.map((feature: { properties: { id?: string; filename?: string }; geometry: { coordinates: [number, number] } }) => ({
        id: feature.properties?.id || `shot-${Math.random()}`,
        filename: feature.properties?.filename || "Unknown",
        coordinates: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]] as L.LatLngTuple,
      }));

      this.setShots(cameraShots);
    } catch (error) {
      console.error("Error fetching camera shots:", error);
    }
  }

  // Set shots and update the map
  setShots(shots: CameraShot[]): void {
    this.shots = shots;
    this.updateMap();
    this.notifyListeners();
  }

  // Get current shots
  getShots(): CameraShot[] {
    return this.shots;
  }

  // Notify components when shots change
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.shots));
  }

  // Add a listener to detect changes
  addListener(callback: (shots: CameraShot[]) => void): void {
    this.listeners.push(callback);
  }

  // Remove a listener
  removeListener(callback: (shots: CameraShot[]) => void): void {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  // Clear all camera shot markers
  clearShots(): void {
    this.markerLayer.clearLayers();
    this.setShots([]);
  }

  // Update the map with camera shot markers
  private updateMap(): void {
    if (!this.map) return;
    this.markerLayer.clearLayers();

    this.shots.forEach((shot) => {
      const marker = L.marker(shot.coordinates, {
        icon: L.divIcon({
          className: "camera-marker",
          html: "📷", // Camera emoji as overlay
          iconSize: [25, 25],
          iconAnchor: [12, 12],
        }),
      }).addTo(this.markerLayer);

      // Attach marker ID for reference
      (marker as L.Marker & { shotId?: string }).shotId = shot.id;
    });
  }
}

// Export the singleton instance
export const cameraShotsService = new CameraShotsService();
