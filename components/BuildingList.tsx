import React, { useEffect, useState } from "react";
import proj4 from "proj4";

// Define the projection (EPSG:4326 to EPSG:32647 - UTM Zone 47N)
const fromProjection = "EPSG:4326"; // WGS84 (Lat/Lng)
const toProjection = "+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs"; // UTM Zone 47N (EPSG:32647)

// Define the projection in proj4
proj4.defs("EPSG:32647", toProjection);

interface PolygonData {
  polygonid: string;
  coordinates: [number, number][]; // [Latitude, Longitude]
}

// Convert geographic coordinates to UTM
const convertToUTM = (lat: number, lng: number): [number, number] => {
  return proj4(fromProjection, toProjection, [lng, lat]) as [number, number];
};

// Calculate the area using the Shoelace formula in UTM coordinates
const calculatePolygonArea = (coordinates: [number, number][]): number => {
  const utmCoordinates = coordinates.map(([lat, lng]) => convertToUTM(lat, lng));

  let area = 0;
  const numPoints = utmCoordinates.length;

  if (numPoints < 3) return 0; // Not a valid polygon

  for (let i = 0; i < numPoints; i++) {
    const [x1, y1] = utmCoordinates[i];
    const [x2, y2] = utmCoordinates[(i + 1) % numPoints];
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area / 2); // Absolute value to ensure positive area
};

const BuildingList = ({ projectId }: { projectId: string }) => {
  const [polygons, setPolygons] = useState<PolygonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPolygonData = async () => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/assets?action=serve&file=building/geo_polygon_definitions.json`
        );

        if (response.status === 404) {
          console.warn("Building footprint has not been created yet.");
          setPolygons([]); // Ensure empty state if no data
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch polygon data: ${response.statusText}`);
        }

        const data: PolygonData[] = await response.json();
        setPolygons(data);
      } catch (error) {
        console.error("Error fetching polygon data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolygonData();
  }, [projectId]);

  return (
    <div className="">
      <h2 className="text-lg font-bold py-4">Building List</h2>

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : polygons.length === 0 ? (
        <p className="text-gray-500 p-4">No building footprints available.</p>
      ) : (
        <table className="bg-white border border-gray-300 w-fit shadow-md rounded-md">
          <thead>
            <tr className="bg-gray-200">
              <th className="border py-2 text-center">Shape</th>
              <th className="border py-2">Polygon ID</th>
              <th className="border py-2">Area (sq meters)</th>
            </tr>
          </thead>
          <tbody>
            {polygons.map((polygon) => {
              // Convert to UTM for visualization
              const utmCoordinates = polygon.coordinates.map(([lat, lng]) => convertToUTM(lat, lng));

              // Get min/max for width/height calculations
              const minX = Math.min(...utmCoordinates.map(([x]) => x));
              const minY = Math.min(...utmCoordinates.map(([, y]) => y));
              const maxX = Math.max(...utmCoordinates.map(([x]) => x));
              const maxY = Math.max(...utmCoordinates.map(([, y]) => y));

              const width = maxX - minX;
              const height = maxY - minY;

              // Calculate the best scale factor to fit inside the 100x100 SVG
              const scale = width > height ? 90 / width : 90 / height;

              // Normalize and scale coordinates
              const normalizedCoords = utmCoordinates.map(([x, y]) => [
                (x - minX) * scale + 5, // Shift by 5 to center
                (maxY - y) * scale + 5, // Flip and shift by 5 to center
              ]);

              return (
                <tr key={polygon.polygonid} className="border-b">
                  {/* First Column: Shape */}
                  <td className="border px-4 py-2">
                    <button>
                      <svg width="100" height="100" viewBox="0 0 100 100">
                        <polygon
                          points={normalizedCoords.map(([x, y]) => `${x},${y}`).join(" ")}
                          fill="lightblue"
                          stroke="blue"
                          strokeWidth="1"
                        />
                      </svg>
                    </button>
                  </td>
                  {/* Second Column: Polygon ID */}
                  <td className="border px-4 py-2">{polygon.polygonid}</td>
                  {/* Third Column: Area */}
                  <td className="border px-4 py-2">
                    {calculatePolygonArea(polygon.coordinates).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BuildingList;
