import { Box, Stack, Text } from "@chakra-ui/react";
import MapComponent from "../components/MapContainer";
import { SearchBar } from "../components/SearchBar";
import SliderCustom from "../components/Slider";
import RadioButtons from "../components/RadioButtons";
import { useSelector, useDispatch } from "react-redux";
import CustomCheckbox from "../components/Checkbox";
import { useState } from "react";
import { setRouteType, setWeatherSelected } from "../../redux/slices/configuration";

function MapPage() {
  const dispatch = useDispatch();
  const { origin } = useSelector((state) => state.Coordinates);
  const { destination } = useSelector((state) => state.Coordinates);
  const [RainChecked, setRainChecked] = useState(false);
  const [WindChecked, setWindChecked] = useState(false);
  const [TempChecked, setTempChecked] = useState(false);
  const [HumChecked, setHumChecked] = useState(false);
  const [weatherSelected, setWeatherSelectedLocal] = useState([]);

  function handleToggle(item, checked, setChecked) {
    const isChecked = typeof checked === "boolean" ? checked : !(
      item === "Rain" ? RainChecked :
      item === "Wind" ? WindChecked :
      item === "Temp" ? TempChecked :
      HumChecked
    );

    setChecked(isChecked);

    const newSelected = isChecked
      ? (weatherSelected.includes(item) ? weatherSelected : [...weatherSelected, item])
      : weatherSelected.filter((i) => i !== item);

    setWeatherSelectedLocal(newSelected);
    dispatch(setWeatherSelected(newSelected)); // triggers reducer console.log
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
        // transform="translateX(-50%)"
        zIndex="1000" // Asegura que esté sobre el mapa
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
              ? `Origin: ${origin[0]}, ${origin[1]}`
              : "Origin..."
          }
        />

        <SearchBar
          PlaceholderText={
            destination[0] !== 0 || destination[1] !== 0
              ? `Destination: ${destination[0]}, ${destination[1]}`
              : "Destination..."
          }
        />

        <RadioButtons
          items={[
            {
              label: "Single Route: Shows a single route on the map",
              value: "1",
            },
            {
              label: "Multiple Routes: Shows multiple routes on the map",
              value: "2",
            },
            {
              label:
                "Optimization: Show multiple routes optimized for a single weight",
              value: "3",
            },
          ]}
          onSelect={(value) => setRouteType(value)}
        />
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
        <SliderCustom element="Brightness" />
        <SliderCustom element="Brightness" />
        <SliderCustom element="Brightness" />
        <SliderCustom element="Brightness" />
        <SliderCustom element="Brightness" />
      </Stack>

      <MapComponent />
    </Box>
  );
}

export default MapPage;