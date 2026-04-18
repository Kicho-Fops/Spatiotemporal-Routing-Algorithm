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
import L, { Layer } from "leaflet";
import { useSelector, useDispatch } from "react-redux";
import { setOrigin, setDestination } from "../../redux/slices/coordinates";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import D3RouteOverlay from "./D3RouteOverlay";



let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const ROUTE_COLORS = [
  "#2563eb", 
  "#dc2626", 
  "#16a34a", 
  "#9333ea", 
  "#ea580c", 
  "#0891b2", 
  "#be185d", 
  "#4b5563", 
  "#ca8a04", 
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
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains={['a', 'b', 'c', 'd']}
        />

        <ClickHandler />

        <D3RouteOverlay routesArray={routesArray}/>


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
                  // color: ROUTE_COLORS[index % ROUTE_COLORS.length],
                  color: "transparent",
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