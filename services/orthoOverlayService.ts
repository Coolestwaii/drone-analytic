import L from "leaflet";

class OrthoOverlayService {
  private overlay: { imageUrl: string | null; bounds: L.LatLngBoundsExpression | null } = {
    imageUrl: null,
    bounds: null,
  };
  private listeners: ((overlay: { imageUrl: string | null; bounds: L.LatLngBoundsExpression | null }) => void)[] = [];

  // Get the current overlay state
  getOverlay() {
    return this.overlay;
  }

  // Update the overlay state and notify listeners
  setOverlay(imageUrl: string, bounds: L.LatLngBoundsExpression) {
    this.overlay = { imageUrl, bounds };
    this.notifyListeners();
  }

  // Add a listener to be notified when the overlay changes
  addListener(callback: (overlay: { imageUrl: string | null; bounds: L.LatLngBoundsExpression | null }) => void) {
    this.listeners.push(callback);
  }

  // Remove a listener
  removeListener(callback: (overlay: { imageUrl: string | null; bounds: L.LatLngBoundsExpression | null }) => void) {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  // Notify all listeners of the overlay change
  private notifyListeners() {
    this.listeners.forEach((callback) => callback(this.overlay));
  }
}

export const orthoOverlayService = new OrthoOverlayService();
