import {
  Box,
  Button,
  Separator,
  Stack,
  Text,
  IconButton,
} from "@chakra-ui/react";
import MapComponent from "../components/MapContainer";
import { SearchBar } from "../components/SearchBar";
import SliderCustom from "../components/Slider";
import RadioButtons from "../components/RadioButtons";
import { useSelector, useDispatch } from "react-redux";
import CustomCheckbox from "../components/Checkbox";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, MapPin } from "lucide-react"; // Icons for collapsing
import {
  setRouteType,
  setWeatherSelected,
  setRainWeight,
  setWindWeight,
  setTempWeight,
  setHumWeight,
  setNumberOfPaths,
} from "../../redux/slices/configuration";
import { setRoute } from "../../redux/slices/routeCoordinates";
import NumberInputWrapper from "../components/NumberInputWrapper";
import TextEditor from "../components/TextEditor.jsx";

import { setSpecification } from "../../redux/slices/specification";

import { parseSpecification } from 'streetweave';
// import { ParsedSpec } from 'streetweave'; 

/**
 * 
 * 17/04/26 
 * Ok, when did this become a nearly 500 line file? Good god
 * 
 */


function MapPage() {
  const dispatch = useDispatch();

  const [isCollapsed, setIsCollapsed] = useState(false); // Controls the collapse
  const [isTextEditorCollapsed, setIsTextEditorCollapsed] = useState(false);
  const [RainChecked, setRainChecked] = useState(false);
  const [WindChecked, setWindChecked] = useState(false);
  const [TempChecked, setTempChecked] = useState(false);
  const [HumChecked, setHumChecked] = useState(false);
  const [weatherSelectedLocal, setWeatherSelectedLocal] = useState([]);

  const currentUnitSpec = parsedSpec.length > 0 ? parsedSpec[0].unit : null;

  const { origin } = useSelector((state) => state.Coordinates);
  const { destination } = useSelector((state) => state.Coordinates);
  const {
    rainWeight,
    windWeight,
    tempWeight,
    humWeight,
    numberOfPaths,
    RouteType,
  } = useSelector((state) => state.Configuration);
  const selectedWeather = useSelector(
    (state) => state.Configuration.weatherSelected,
  );

  


  // Sync Path count with RouteType 1
  useEffect(() => {
    if (RouteType === 1) {
      dispatch(setNumberOfPaths(1));
    }
  }, [RouteType, dispatch]);





  function handleResetWeights() {
    const activeWeather = selectedWeather.filter((item) => item !== "");
    if (activeWeather.length === 0) return;

    const currentWeights = {
      rain: selectedWeather.includes("rain") ? rainWeight : 0,
      wind: selectedWeather.includes("wind") ? windWeight : 0,
      heat: selectedWeather.includes("heat") ? tempWeight : 0,
      humidity: selectedWeather.includes("humidity") ? humWeight : 0,
    };

    const total = Object.values(currentWeights).reduce(
      (sum, val) => sum + val,
      0,
    );

    activeWeather.forEach((key) => {
      const normalizedValue =
        total === 0 ? 1 / activeWeather.length : currentWeights[key] / total;
      if (key === "rain") dispatch(setRainWeight(normalizedValue));
      if (key === "wind") dispatch(setWindWeight(normalizedValue));
      if (key === "heat") dispatch(setTempWeight(normalizedValue));
      if (key === "humidity") dispatch(setHumWeight(normalizedValue));
    });
  }

  function handleRouteCalculation() {
    const activeWeights = [];
    if (selectedWeather?.includes("rain")) activeWeights.push(rainWeight);
    if (selectedWeather?.includes("heat")) activeWeights.push(tempWeight);
    if (selectedWeather?.includes("humidity")) activeWeights.push(humWeight);
    if (selectedWeather?.includes("wind")) activeWeights.push(windWeight);

    fetch("http://localhost:5000/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: "chicago",
        origin: { lat: origin[0], lon: origin[1] },
        destination: { lat: destination[0], lon: destination[1] },
        map_view_mode: "Custom weights",
        paths: numberOfPaths,
        weather: selectedWeather,
        weights: activeWeights,
        time: 17,
        Graph_name: "chicago",
      }),
    })
      .then((res) => res.json())
      .then((data) => dispatch(setRoute(data)))
      .catch((err) => console.error("Error:", err));
  }

  function handleChangeRouteType(e) {
    dispatch(setRouteType(Number(e.target.value)));
    setRainChecked(false);
    setWindChecked(false);
    setTempChecked(false);
    setHumChecked(false);
    setWeatherSelectedLocal([]);
    dispatch(setWeatherSelected([]));
  }

  function handleWeatherRadioSelect(e) {
    const newSelected = [e.target.value];
    setWeatherSelectedLocal(newSelected);
    dispatch(setWeatherSelected(newSelected));
  }

  function handleToggle(item, checked, setChecked) {
    setChecked(checked);
    const newSelected = checked
      ? [...weatherSelectedLocal, item]
      : weatherSelectedLocal.filter((i) => i !== item);

    setWeatherSelectedLocal(newSelected);
    dispatch(setWeatherSelected(newSelected));
  }

  const totalWeight = (
    (selectedWeather?.includes("rain") ? rainWeight : 0) +
    (selectedWeather?.includes("wind") ? windWeight : 0) +
    (selectedWeather?.includes("heat") ? tempWeight : 0) +
    (selectedWeather?.includes("humidity") ? humWeight : 0)
  ).toFixed(2);

  const [parsedSpec, setParsedSpec] = useState([]);

  const applySpec = (spec) => {
    console.log("Applying specification:", spec);
    const parsedLayers = parseSpecification(spec);
    if (parsedLayers.length > 0) {
      console.log("Specification:", parsedLayers[0]);
      setParsedSpec(parsedLayers);
      dispatch(setSpecification(parsedLayers));

    }
  };

  return (
    <Box position="relative" width="100vw" height="100vh" overflow="hidden">
      <Stack
        position="absolute"
        top="20px"
        left="5%"
        zIndex="1000"
        width={{ base: "90%", md: "400px" }}
        maxHeight="calc(100vh - 40px)"
        gap={4}
        pointerEvents="none"
      >
        <Stack
          pointerEvents="auto"
          flexShrink={1}
          overflowY={isCollapsed ? "hidden" : "auto"}
          overflowX="hidden"
          background={"white"}
          padding={6}
          borderRadius={20}
          boxShadow="2xl"
          transition="all 0.3s ease"
        >

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={isCollapsed ? 0 : 4}
        >
          <Text fontSize="lg" fontWeight="bold">
            Configuration
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            borderRadius="full"
          >
            {isCollapsed ? <ChevronDown /> : <ChevronUp />}
          </Button>
        </Box>


        {!isCollapsed && (
          <Stack gap="4">
            <Text fontSize="sm" color="gray.600">
              Select origin and destination to calculate routes.
            </Text>

            <SearchBar
              PlaceholderText={
                origin[0] !== 0 ? `${origin[0]}, ${origin[1]}` : "Origin..."
              }
            />
            <SearchBar
              PlaceholderText={
                destination[0] !== 0
                  ? `${destination[0]}, ${destination[1]}`
                  : "Destination..."
              }
            />

            <Separator />

            <RadioButtons
              onSelect={handleChangeRouteType}
              items={[
                { label: "Single Route", value: 1 },
                { label: "Multiple Routes (Weighted)", value: 2 },
                { label: "Optimization (Single Weight)", value: 3 },
              ]}
            />

            <Separator />

            {/* Weather Selection Logic */}
            {(RouteType === 1 || RouteType === 2) && (
              <Stack gap="1">
                {RouteType === 2 && (
                  <NumberInputWrapper
                    value={numberOfPaths}
                    onChange={(val) => dispatch(setNumberOfPaths(val))}
                  />
                )}
                <CustomCheckbox
                  isChecked={RainChecked}
                  label="Rain"
                  onChange={(v) => handleToggle("rain", v, setRainChecked)}
                />
                <CustomCheckbox
                  isChecked={WindChecked}
                  label="Wind"
                  onChange={(v) => handleToggle("wind", v, setWindChecked)}
                />
                <CustomCheckbox
                  isChecked={TempChecked}
                  label="Temperature"
                  onChange={(v) => handleToggle("heat", v, setTempChecked)}
                />
                <CustomCheckbox
                  isChecked={HumChecked}
                  label="Humidity"
                  onChange={(v) => handleToggle("humidity", v, setHumChecked)}
                />
              </Stack>
            )}

            {RouteType === 3 && (
              <Stack gap="3">
                <NumberInputWrapper
                  value={numberOfPaths}
                  onChange={(val) => dispatch(setNumberOfPaths(val))}
                />
                <RadioButtons
                  onSelect={handleWeatherRadioSelect}
                  items={[
                    { label: "Rain", value: "rain" },
                    { label: "Wind", value: "wind" },
                    { label: "Temperature", value: "heat" },
                    { label: "Humidity", value: "humidity" },
                  ]}
                />
              </Stack>
            )}

            <Separator />

            {/* SLIDERS */}
            {selectedWeather?.includes("rain") && (
              <SliderCustom
                element="Rain"
                startingValue={rainWeight}
                onChange={(e) => {
                  dispatch(setRainWeight(Number(e)));
                }}
              />
            )}
            {selectedWeather?.includes("wind") && (
              <SliderCustom
                element="Wind"
                startingValue={windWeight}
                onChange={(e) => {
                  dispatch(setWindWeight(Number(e)));
                }}
              />
            )}
            {selectedWeather?.includes("heat") && (
              <SliderCustom
                element="Temperature"
                startingValue={tempWeight}
                onChange={(e) => {
                  dispatch(setTempWeight(Number(e)));
                }}
              />
            )}
            {selectedWeather?.includes("humidity") && (
              <SliderCustom
                element="Humidity"
                startingValue={humWeight}
                onChange={(e) => {
                  dispatch(setHumWeight(Number(e)));
                }}
              />
            )}

            <Box p={3} bg="gray.50" borderRadius="md">
              <Text fontSize="sm" fontWeight="bold">
                Total Weight: {totalWeight}
              </Text>
              {totalWeight > 1.01 ? (
                <Button
                  size="xs"
                  colorPalette="red"
                  mt={2}
                  onClick={handleResetWeights}
                  width="100%"
                >
                  Normalize Weights to 1.0
                </Button>
              ) : (
                <Button
                  colorPalette="blue"
                  mt={4}
                  width="100%"
                  onClick={handleRouteCalculation}
                  disabled={origin[0] === 0}
                >
                  Calculate Route
                </Button>
              )}
            </Box>
          </Stack>
        )}
        </Stack>
        
        <Stack
          pointerEvents="auto"
          flexShrink={0}
          overflowY={isTextEditorCollapsed ? "hidden" : "auto"}
          overflowX="hidden"
          background={"white"}
          padding={6}
          borderRadius={20}
          boxShadow="2xl"
          transition="all 0.3s ease"
        >

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={isTextEditorCollapsed ? 0 : 4}
        >
          <Text fontSize="lg" fontWeight="bold">
            Text Editor
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsTextEditorCollapsed(!isTextEditorCollapsed)}
            borderRadius="full"
            
          >
            {isTextEditorCollapsed ? <ChevronDown /> : <ChevronUp />}
          </Button>
        </Box>

         {!isTextEditorCollapsed && (
          <TextEditor onApply={applySpec} />
         )}

      </Stack>
      </Stack>

      <MapComponent/>
    </Box>
  );
}

export default MapPage;
