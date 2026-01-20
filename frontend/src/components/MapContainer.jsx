import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Polyline,
  Tooltip,
  LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./Map.css";
import L from "leaflet";
import { useSelector, useDispatch } from "react-redux";
import { setOrigin, setDestination } from "../../redux/slices/coordinates";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// --- Leaflet Marker Fix ---
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Colors for the different Routing Modes ---
const ROUTE_COLORS = [
  "#2563eb", // Royal Blue
  "#dc2626", // Red
  "#16a34a", // Green
  "#9333ea", // Purple
  "#ea580c", // Orange
  "#0891b2", // Cyan
  "#be185d", // Pink
  "#4b5563", // Gray
  "#ca8a04", // Gold
];

function MapComponent() {
  const dispatch = useDispatch();

  // Redux Selectors
  const { origin, destination } = useSelector((state) => state.Coordinates);
  const routeState = useSelector((state) => state.Route.routes);

  // Safely extract the array from: Object { route_coords: [...] }
  const routesArray = routeState?.route_coords || [];

  // Helper component to handle clicking on the map to set pins
  function ClickHandler() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        const originIsSet = origin[0] !== 0 || origin[1] !== 0;
        const destinationIsSet = destination[0] !== 0 || destination[1] !== 0;

        if (!originIsSet || (originIsSet && destinationIsSet)) {
          // Reset: New Origin, Clear Destination
          dispatch(setOrigin([lat, lng]));
          dispatch(setDestination([0, 0]));
        } else {
          // Set Destination
          dispatch(setDestination([lat, lng]));
        }
      },
    });
    return null;
  }

  return (
    <div className="map-wrapper" style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[41.8781, -87.6298]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler />


        <LayersControl position="topright">
          {routesArray.map((route, index) => (
            <LayersControl.Overlay
              key={route.route_index || index}
              name={`Route: ${route.weight_type}`}
              checked={index === 0} 
            >
              <Polyline
                positions={route.coordinates} 
                pathOptions={{
                  color: ROUTE_COLORS[index % ROUTE_COLORS.length],
                  weight: 5,
                  opacity: 0.8,
                  lineJoin: "round",
                }}
              >
                <Tooltip sticky>
                  <div style={{ lineHeight: "1.5" }}>
                    <strong>{route.weight_type.toUpperCase()}</strong>
                    <br />
                    Distance: {route.distance} KM
                    <br />
                    Duration: {route.duration} min
                    <br />
                    Rain Exposure: {route.rain_exposure?.toFixed(2)}
                    <br />
                    Wind Exposure: {route.wind_exposure?.toFixed(2)}
                    <br />
                    Heat Exposure: {route.heat_exposure?.toFixed(2)}
                    <br />
                    Humidity Exposure: {route.humidity_exposure?.toFixed(2)}
                  </div>
                </Tooltip>
              </Polyline>
            </LayersControl.Overlay>
          ))}
        </LayersControl>


        {origin && origin[0] !== 0 && (
          <Marker position={[origin[0], origin[1]]}>
            <Popup>
              <strong>Origin</strong> <br />
              {origin[0].toFixed(4)}, {origin[1].toFixed(4)}
            </Popup>
          </Marker>
        )}

        {destination && destination[0] !== 0 && (
          <Marker position={[destination[0], destination[1]]}>
            <Popup>
              <strong>Destination</strong> <br />
              {destination[0].toFixed(4)}, {destination[1].toFixed(4)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default MapComponent;