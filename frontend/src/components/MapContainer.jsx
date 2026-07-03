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
  LayerGroup,
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


  // const routesArray = routeState?.route_coords || [];


  let routesArray = [];
  if (routeState?.type === "FeatureCollection") {
    routesArray = routeState.features;
  } else if (routeState?.route_coords) {
    routesArray = routeState.route_coords;
  } else if (Array.isArray(routeState)) {
    routesArray = routeState;
  }



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
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          subdomains={['a', 'b', 'c', 'd']}
        />

        <ClickHandler />

        <D3RouteOverlay routesArray={routesArray}/>


        <LayersControl position="topright">
          {(() => {
            // 1. Define the 5 specific categories you want
            const targetCategories = [
              "rain-aware-route",
              "heat-aware-route",
              "wind-aware-route",
              "humidity-aware-route",
              "fastest-route"
            ];
            
            // 2. Group all incoming map fragments by their weight_type
            const groupedRoutes = {};
            routesArray.forEach((route) => {
              const isGeoJSON = !!route.geometry;
              const properties = isGeoJSON ? route.properties : route;
              const weightType = properties.weight_type || "unknown";

              if (!groupedRoutes[weightType]) {
                groupedRoutes[weightType] = [];
              }
              groupedRoutes[weightType].push({ route, properties, isGeoJSON });
            });

            // 3. Render exactly 1 checkbox per target category
            return targetCategories.map((category, index) => {
              const categoryRoutes = groupedRoutes[category];
              
              // Skip if no routes exist for this category
              if (!categoryRoutes || categoryRoutes.length === 0) return null;

              return (
                <LayersControl.Overlay
                  key={category}
                  name={`Route: ${category}`}
                  checked={index === 0} 
                >
                  {/* LayerGroup lets us render multiple Polylines inside a single overlay */}
                  <LayerGroup>
                    {categoryRoutes.map((item, i) => {
                      const { route, properties, isGeoJSON } = item;
                      const positions = isGeoJSON 
                        ? route.geometry.coordinates.map(coord => [coord[1], coord[0]])
                        : route.coordinates;

                      return (
                        <Polyline
                          key={i}
                          positions={positions} 
                          pathOptions={{
                            color: "transparent",
                            weight: 20, 
                            opacity: 0.8,
                            lineJoin: "round",
                          }}
                        >
                          <Tooltip sticky>
                            <div style={{ lineHeight: "1.5" }}>
                              <strong>{category}</strong>
                              <br />
                              Distance: {properties.distance} KM
                              <br />
                              Duration: {properties.duration} min
                              <br />
                              Rain Exposure: {properties.rain_exposure?.toFixed(2)}
                              <br />
                              Wind Exposure: {properties.wind_exposure?.toFixed(2)}
                              <br />
                              Heat Exposure: {properties.heat_exposure?.toFixed(2)}
                              <br />
                              Humidity Exposure: {properties.humidity_exposure?.toFixed(2)}
                            </div>
                          </Tooltip>
                        </Polyline>
                      );
                    })}
                  </LayerGroup>
                </LayersControl.Overlay>
              );
            });
          })()}
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