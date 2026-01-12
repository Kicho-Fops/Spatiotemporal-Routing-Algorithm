import { Box, Stack } from "@chakra-ui/react";
import MapComponent from "../components/MapContainer";
import { SearchBar } from "../components/SearchBar";
import SliderCustom from "../components/Slider";
import RadioButtons from "../components/RadioButtons";

function MapPage() {
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
        <SearchBar PlaceholderText="Origin..." />
        <SearchBar PlaceholderText="Destination..." />
        <RadioButtons
          items={[
            { label: "Option 1", value: "1" },
            { label: "Option 2", value: "2" },
            { label: "Option 3", value: "3" },
            { label: "Option 4", value: "4" },
            { label: "Option 5", value: "5" },
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
