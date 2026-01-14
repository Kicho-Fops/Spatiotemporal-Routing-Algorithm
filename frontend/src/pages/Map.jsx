import { Box, Stack, Text } from "@chakra-ui/react";
import MapComponent from "../components/MapContainer";
import { SearchBar } from "../components/SearchBar";
import SliderCustom from "../components/Slider";
import RadioButtons from "../components/RadioButtons";
import { useSelector } from "react-redux";
function MapPage() {
  const { origin } = useSelector((state) => state.Coordinates);
  const { destination } = useSelector((state) => state.Coordinates);

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
