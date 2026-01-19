import { Box, Button, Separator, Stack, Text } from "@chakra-ui/react";
import MapComponent from "../components/MapContainer";
import { SearchBar } from "../components/SearchBar";
import SliderCustom from "../components/Slider";
import RadioButtons from "../components/RadioButtons";
import { useSelector, useDispatch } from "react-redux";
import CustomCheckbox from "../components/Checkbox";
import { useState, useEffect } from "react";
import {
  setRouteType,
  setWeatherSelected,
  setRainWeight,
  setWindWeight,
  setTempWeight,
  setHumWeight,
  setNumberOfPaths,
} from "../../redux/slices/configuration";
import NumberInputWrapper from "../components/NumberInputWrapper";

function MapPage() {
  const dispatch = useDispatch();
  
  const { origin } = useSelector((state) => state.Coordinates);
  const { destination } = useSelector((state) => state.Coordinates);
  const { rainWeight, windWeight, tempWeight, humWeight, numberOfPaths } =
  useSelector((state) => state.Configuration);
  const RouteType = useSelector((state) => state.Configuration.RouteType);
  
  const selectedWeather = useSelector(
    (state) => state.Configuration.weatherSelected,
  );
  
  const [RainChecked, setRainChecked] = useState(false);
  const [WindChecked, setWindChecked] = useState(false);
  const [TempChecked, setTempChecked] = useState(false);
  const [HumChecked, setHumChecked] = useState(false);
  const [weatherSelected, setWeatherSelectedLocal] = useState([]);
  
  useEffect(() => {
    if (RouteType === 1) {
      dispatch(setNumberOfPaths(1));
    }
  }, [RouteType, dispatch]);
  function handleResetWeights() {
    const activeWeather = selectedWeather.filter((item) => item !== "");

    if (activeWeather.length === 0) return;
    const currentWeights = {};
    if (selectedWeather.includes("rain")) currentWeights.rain = rainWeight;
    if (selectedWeather.includes("wind")) currentWeights.wind = windWeight;
    if (selectedWeather.includes("heat")) currentWeights.heat = tempWeight;
    if (selectedWeather.includes("humidity"))
      currentWeights.humidity = humWeight;
    
    const total = Object.values(currentWeights).reduce(
      (sum, val) => sum + val,
      0,
    );
    activeWeather.forEach((key) => {
      let normalizedValue;

      if (total === 0) {
        normalizedValue = 1 / activeWeather.length;
      } else {
        // Proportional normalization
        normalizedValue = currentWeights[key] / total;
      }

      // Update the Redux store
      switch (key) {
        case "rain":
          dispatch(setRainWeight(normalizedValue));
          break;
        case "wind":
          dispatch(setWindWeight(normalizedValue));
          break;
        case "heat":
          dispatch(setTempWeight(normalizedValue));
          break;
        case "humidity":
          dispatch(setHumWeight(normalizedValue));
          break;
        default:
          break;
      }
    });
  }

  function handleRouteCalculation() {
    const activeWeights = [];

    // Keep in this order specifically, this way we ensure that the order of the weights corresponds to the order of the weather types
    if (selectedWeather?.includes("rain")) activeWeights.push(rainWeight);
    if (selectedWeather?.includes("heat")) activeWeights.push(tempWeight);
    if (selectedWeather?.includes("humidity")) activeWeights.push(humWeight);
    if (selectedWeather?.includes("wind")) activeWeights.push(windWeight);
    fetch("http://localhost:5000/route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
      .then((response) => response.json())
      .then((data) => {
        console.log("Route calculation response:", data);
        // Handle the response data as needed
      })
      .catch((error) => {
        console.error("Error calculating route:", error);
      });
  }

  // Handler for Route Type change: Updates Redux and resets all weather selections
  function handleChangeRouteType(e) {
    const value = e.target.value;
    dispatch(setRouteType(value));

    // Reset visual checkbox states
    setRainChecked(false);
    setWindChecked(false);
    setTempChecked(false);
    setHumChecked(false);

    // Reset selected data  in Redux and local state
    setWeatherSelectedLocal([]);
    dispatch(setWeatherSelected([]));
  }
  // Handler for Radio Buttons (RouteType 2 & 3): Single Selection
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

  const totalWeight = (
    (selectedWeather?.includes("rain") ? rainWeight : 0) +
    (selectedWeather?.includes("wind") ? windWeight : 0) +
    (selectedWeather?.includes("heat") ? tempWeight : 0) +
    (selectedWeather?.includes("humidity") ? humWeight : 0)
  ).toFixed(2);

  function handleRainChange(value) {
    handleToggle("rain", value, setRainChecked);
  }

  function handleWindChange(value) {
    handleToggle("wind", value, setWindChecked);
  }

  function handleTempChange(value) {
    handleToggle("heat", value, setTempChecked);
  }

  function handleHumChange(value) {
    handleToggle("humidity", value, setHumChecked);
  }

  return (
    <Box position="relative" width="100vw" height="100vh" overflow="hidden">
      <Stack
        position="absolute"
        top="20px"
        left="5%"
        zIndex="1000"
        width={{ base: "90%", md: "400px" }}
        maxHeight="calc(100vh - 40px)" // Ensures it stays 20px away from the bottom too
        overflowY="auto"               // Enables vertical scrolling
        overflowX="hidden"
        gap="2"
        background={"white"}
        padding={10}
        borderRadius={16}
      >
        <Text fontSize="xl" fontWeight="bold" marginBottom={4}>
          Select an origin and destination or click 2 points on
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
        <Separator />

        <RadioButtons
          items={[
            {
              label: "Single Route: Shows a single route on the map",
              value: 1,
            },
            {
              label:
                "Multiple Routes: Shows multiple routes on the map calculated with multiple weights",
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
        <Separator />

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
          <Stack>
            <NumberInputWrapper
              onChange={(value) => {
                dispatch(setNumberOfPaths(value));
              }}
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
          </Stack>
        )}
        {/* If I want to reset the selection of the buttons, the easiest way is to reset the state */}
        {RouteType == 3 && (
          <>
            <NumberInputWrapper
              onChange={(value) => {
                dispatch(setNumberOfPaths(value));
              }}
            />
            <RadioButtons
              items={[
                {
                  label: "Rain",
                  value: "rain",
                },
                {
                  label: "Wind",
                  value: "wind",
                },
                {
                  label: "Temperature",
                  value: "heat", // Changed to "heat" to match toggle logic key
                },
                { label: "Humidity", value: "humidity" },
              ]}
              onSelect={handleWeatherRadioSelect}
            />
          </>
        )}

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

        <Text>Sum of all weights: {totalWeight}</Text>
        {totalWeight > 1 && (
          <Text color="red">
            The total weight exceeds 1.{" "}
            <Button onClick={handleResetWeights}>Reset Weights</Button>
          </Text>
        )}
        {totalWeight <= 1 && (
          <Button onClick={handleRouteCalculation}>Calculate route</Button>
        )}
      </Stack>

      <MapComponent />
    </Box>
  );
}

export default MapPage;
