import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./Map.css";
import L from "leaflet";
// import PhotonSearchControl from '../components/SearchBar';
import { useSelector, useDispatch } from "react-redux";
import { setOrigin, setDestination } from "../../redux/slices/coordinates";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { Box } from "lucide-react";
import { SearchBar } from "./SearchBar";
// import SearchBox from '../components/SearchBar';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapComponent() {
  const { origin } = useSelector((state) => state.Coordinates);
  const { destination } = useSelector((state) => state.Coordinates);
  const dispatch = useDispatch();

  function ClickHandler() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;

        const originIsSet = origin[0] !== 0 || origin[1] !== 0;
        const destinationIsSet = destination[0] !== 0 || destination[1] !== 0;

        if (!originIsSet || (originIsSet && destinationIsSet)) {
          // First click OR Third click (reset cycle)
          dispatch(setOrigin([lat, lng]));
          dispatch(setDestination([0, 0])); // Clear destination on restart
        } else {
          // Second click
          dispatch(setDestination([lat, lng]));
        }
      },
    });
    return null;
  }

  return (
    <div className="map-wrapper">
      <MapContainer
        center={[41.87013663164413, -87.64936415882626]}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler />

        {Array.isArray(origin) && origin[0] != null && origin[1] != null && (
          <Marker position={[origin[0], origin[1]]}>
            <Popup>
              Origin: {origin[0]}, {origin[1]}
            </Popup>
          </Marker>
        )}

        {Array.isArray(destination) &&
          destination[0] != null &&
          destination[1] != null && (
            <Marker position={[destination[0], destination[1]]}>
              <Popup>
                Destination: {destination[0]}, {destination[1]}
              </Popup>
            </Marker>
          )}
      </MapContainer>
    </div>
  );
}

export default MapComponent;
