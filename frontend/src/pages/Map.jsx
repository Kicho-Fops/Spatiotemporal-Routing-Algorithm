import { Box, Stack, Text } from "@chakra-ui/react";
import MapComponent from "../components/MapContainer";
import { SearchBar } from "../components/SearchBar";
import SliderCustom from "../components/Slider";
import RadioButtons from "../components/RadioButtons";
import { useSelector, useDispatch } from "react-redux";
import CustomCheckbox from "../components/Checkbox";
import { useState } from "react";
import {
  setRouteType,
  setWeatherSelected,
} from "../../redux/slices/configuration";

function MapPage() {
  const dispatch = useDispatch();
  const { origin } = useSelector((state) => state.Coordinates);
  const { destination } = useSelector((state) => state.Coordinates);
  const RouteType = useSelector((state) => state.Configuration.RouteType);

  const selectedWeather = useSelector(
    (state) => state.Configuration.weatherSelected
  );

  const [RainChecked, setRainChecked] = useState(false);
  const [WindChecked, setWindChecked] = useState(false);
  const [TempChecked, setTempChecked] = useState(false);
  const [HumChecked, setHumChecked] = useState(false);
  const [weatherSelected, setWeatherSelectedLocal] = useState([]);

  // Handler for Route Type change: Updates Redux and resets all weather selections
  function handleChangeRouteType(e) {
    const value = e.target.value;
    dispatch(setRouteType(value));

    // Reset visual checkbox states
    setRainChecked(false);
    setWindChecked(false);
    setTempChecked(false);
    setHumChecked(false);

    // Reset selected data
    setWeatherSelectedLocal([]);
    dispatch(setWeatherSelected([]));
  }

  // Handler for Radio Buttons (RouteType 2 or 3): Exclusive Selection
  function handleWeatherRadioSelect(e) {
    const value = e.target.value;
    const newSelected = [value]; // Overwrite array with single value

    setWeatherSelectedLocal(newSelected);
    dispatch(setWeatherSelected(newSelected));
  }

  // Handler for Checkboxes (RouteType 1): Multiple Selection
  function handleToggle(item, checked, setChecked) {
    // Explicit boolean from checkbox event
    const isChecked = checked;

    setChecked(isChecked);

    const newSelected = isChecked
      ? weatherSelected.includes(item)
        ? weatherSelected
        : [...weatherSelected, item]
      : weatherSelected.filter((i) => i !== item);

    setWeatherSelectedLocal(newSelected);
    dispatch(setWeatherSelected(newSelected));
  }

  function handleRainChange(value) {
    handleToggle("Rain", value, setRainChecked);
  }

  function handleWindChange(value) {
    handleToggle("Wind", value, setWindChecked);
  }

  function handleTempChange(value) {
    handleToggle("Temp", value, setTempChecked);
  }

  function handleHumChange(value) {
    handleToggle("Hum", value, setHumChecked);
  }

  return (
    <Box position="relative" width="100vw" height="100vh" overflow="hidden">
      <Stack
        position="absolute"
        top="20px"
        left="5%"
        zIndex="1000"
        width={{ base: "90%", md: "400px" }}
        gap="2"
        background={"white"}
        borderColor={"red"}
        borderWidth={10}
        padding={10}
        borderRadius={16}
      >
        <Text fontSize="2xl" fontWeight="bold" marginBottom={4}>
          Route Planner: Select an origin and destination or click 2 points on
          the map
        </Text>
        <SearchBar
          PlaceholderText={
            origin[0] !== 0 || origin[1] !== 0
              ? `${origin[0]}, ${origin[1]}`
              : "Origin..."
          }
        />

        <SearchBar
          PlaceholderText={
            destination[0] !== 0 || destination[1] !== 0
              ? `${destination[0]}, ${destination[1]}`
              : "Destination..."
          }
        />

        <RadioButtons
          items={[
            {
              label: "Single Route: Shows a single route on the map",
              value: 1,
            },
            {
              label: "Multiple Routes: Shows multiple routes on the map",
              value: 2,
            },
            {
              label:
                "Optimization: Show multiple routes optimized for a single weight",
              value: 3,
            },
          ]}
          onSelect={handleChangeRouteType}
        />

        {RouteType == 1 && (
          <Stack>
            <CustomCheckbox
              isChecked={RainChecked}
              onChange={handleRainChange}
              label={"Rain"}
            />
            <CustomCheckbox
              isChecked={WindChecked}
              onChange={handleWindChange}
              label={"Wind"}
            />
            <CustomCheckbox
              isChecked={TempChecked}
              onChange={handleTempChange}
              label={"Temperature"}
            />
            <CustomCheckbox
              isChecked={HumChecked}
              onChange={handleHumChange}
              label={"Humidity"}
            />
          </Stack>
        )}

        {RouteType == 2 && (
          <RadioButtons
            items={[
              {
                label: "Rain",
                value: "Rain",
              },
              {
                label: "Wind",
                value: "Wind",
              },
              {
                label: "Temperature",
                value: "Temp", // Changed to "Temp" to match toggle logic key
              },
              { label: "Humidity", value: "Hum" },
            ]}
            onSelect={handleWeatherRadioSelect}
          />
        )}
        {/* If I want to reset the selection of the buttons, the easiest way is to reset the state */}
        {RouteType == 3 && (
          <RadioButtons
            items={[
              {
                label: "Rain",
                value: "Rain",
              },
              {
                label: "Wind",
                value: "Wind",
              },
              {
                label: "Temperature",
                value: "Temp", // Changed to "Temp" to match toggle logic key
              },
              { label: "Humidity", value: "Hum" },
            ]}
            onSelect={handleWeatherRadioSelect}
          />
        )}

        {selectedWeather?.includes("Rain") && (
          <SliderCustom element="Rain" startingValue={0.85834} />
        )}
        {selectedWeather?.includes("Wind") && (
          <SliderCustom element="Wind" startingValue={0.0285} />
        )}
        {selectedWeather?.includes("Temp") && (
          <SliderCustom element="Temperature" startingValue={0.09648} />
        )}
        {selectedWeather?.includes("Hum") && (
          <SliderCustom element="Humidity" startingValue={0.01668} />
        )}
      </Stack>

      <MapComponent />
    </Box>
  );
}

export default MapPage;
