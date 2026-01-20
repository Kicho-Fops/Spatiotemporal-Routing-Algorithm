import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Polyline,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./Map.css";
import L from "leaflet";
import { useSelector, useDispatch } from "react-redux";
import { setOrigin, setDestination } from "../../redux/slices/coordinates";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Fix for default Leaflet markers
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Distinct colors for multiple routes
const COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#9333ea",
  "#ea580c",
  "#0891b2",
];

function MapComponent() {
  const dispatch = useDispatch();

  const { origin, destination } = useSelector((state) => state.Coordinates);
  const routeState = useSelector((state) => state.Route.routes);

  const routesArray = routeState?.route_coords || [];

  function ClickHandler() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        const originIsSet = origin[0] !== 0 || origin[1] !== 0;
        const destinationIsSet = destination[0] !== 0 || destination[1] !== 0;

        if (!originIsSet || (originIsSet && destinationIsSet)) {
          dispatch(setOrigin([lat, lng]));
          dispatch(setDestination([0, 0]));
        } else {
          dispatch(setDestination([lat, lng]));
        }
      },
    });
    return null;
  }

  return (
    <div className="map-wrapper" style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[41.8701, -87.6493]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler />

        {routesArray.map((route, index) => (
          <Polyline
            key={route.route_index}
            positions={route.coordinates}
            pathOptions={{
              color: COLORS[index % COLORS.length],
              weight: 5,
              opacity: 0.8,
            }}
          >
            <Tooltip sticky>
              <div style={{ padding: "5px" }}>
                <strong>{route.weight_type + " " + route.route_index}</strong>
                <br />
                Distance: {route.distance} KM
                <br />
                Rain Exposure: {route.rain_exposure.toFixed(2)}
                <br />
                Time to Complete: {route.duration} mins
                <br />
                Wind Exposure: {route.wind_exposure.toFixed(2)}
                <br />
                Heat Exposure: {route.heat_exposure.toFixed(2)}
                <br />
                Humidity Exposure: {route.humidity_exposure.toFixed(2)}
              </div>
            </Tooltip>
          </Polyline>
        ))}

        {origin && origin[0] !== 0 && (
          <Marker position={[origin[0], origin[1]]}>
            <Popup>Origin</Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && destination[0] !== 0 && (
          <Marker position={[destination[0], destination[1]]}>
            <Popup>Destination</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default MapComponent;
