import L from 'leaflet';

class MapCenterService {
  private center: L.LatLngTuple = [17.8051206, 98.9507674];
  private listeners: ((center: L.LatLngTuple) => void)[] = [];

  // Get the current center
  getCenter() {
    return this.center;
  }

  // Set a new center and notify all listeners
  setCenter(newCenter: L.LatLngTuple) {
    this.center = newCenter;
    this.notifyListeners();
  }

  // Add a listener to be notified when the center changes
  addListener(callback: (center: L.LatLngTuple) => void) {
    this.listeners.push(callback);
  }

  // Remove a listener
  removeListener(callback: (center: L.LatLngTuple) => void) {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  // Notify all listeners of the center change
  private notifyListeners() {
    this.listeners.forEach((callback) => callback(this.center));
  }
}

export const mapCenterService = new MapCenterService();
