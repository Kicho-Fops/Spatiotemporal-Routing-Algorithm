import React, { useState, useEffect } from "react";
import {
  Box,
  Input,
  Group,
  InputElement,
  VStack,
  Text,
} from "@chakra-ui/react";
import { Search } from "lucide-react";
import { useDebounce } from "use-debounce";
import { setOrigin, setDestination } from "../../redux/slices/coordinates";
import { useDispatch, useSelector } from "react-redux";

export const SearchBar = ({ type, placeholder }) => {
  const { origin, destination } = useSelector((state) => state.Coordinates);
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState([]);
  const [isListVisible, setIsListVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false); // Keeps track of focus to prevent cursor-jumping
  const dispatch = useDispatch();

  const [debounceSearchValue] = useDebounce(searchValue, 300);

  // Watch for changes in Redux (e.g., when the user clicks the map)
  // and update the text input automatically ONLY when the user is NOT actively typing.
  useEffect(() => {
    if (!isFocused) {
      if (type === "origin" && (origin[0] !== 0 || origin[1] !== 0)) {
        setSearchValue(`${origin[0].toFixed(5)}, ${origin[1].toFixed(5)}`);
      } else if (type === "destination" && (destination[0] !== 0 || destination[1] !== 0)) {
        setSearchValue(`${destination[0].toFixed(5)}, ${destination[1].toFixed(5)}`);
      } else {
        setSearchValue("");
      }
    }
  }, [origin, destination, type, isFocused]);

  useEffect(() => {
    const fetchData = async () => {
      // Avoid fetching if the user didn't type a string or typed coordinate patterns
      const isCoordsLike = /^\s*-?\d+(?:\.\d+)?\s*(?:,\s*|\s+)-?\d+(?:\.\d+)?\s*$/.test(debounceSearchValue);
      if (!debounceSearchValue || debounceSearchValue.length < 3 || debounceSearchValue.includes(",") || isCoordsLike) {
        setResults([]);
        return;
      }
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${debounceSearchValue}&limit=5`
        );
        const data = await response.json();
        setResults(data.features || []);
        setIsListVisible(true);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    };

    fetchData();
  }, [debounceSearchValue]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    // If user clears the input, reset the corresponding marker
    if (value.trim() === "") {
      if (type === "origin") {
        dispatch(setOrigin([0, 0]));
      } else {
        dispatch(setDestination([0, 0]));
      }
      return;
    }

    // Match coordinate pairs like "41.85774, -87.65656" or "41.85774 -87.65656"
    const match = value.match(/^\s*(-?\d+(?:\.\d+)?)\s*(?:,\s*|\s+)(-?\d+(?:\.\d+)?)\s*$/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      
      // Validate coordinate ranges
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        if (type === "origin") {
          dispatch(setOrigin([lat, lng]));
        } else {
          dispatch(setDestination([lat, lng]));
        }
      }
    }
  };

  return (
    <Box position="relative" width="full">
      <Group attached borderRadius="5px" size="sm" width="full">
        <InputElement pointerEvents="none" color="gray.600" ml="2">
          <Search size="16px" />
        </InputElement>

        <Input
          type="text"
          value={searchValue}
          placeholder={placeholder}
          pl="10"
          bg="white"
          border="2px solid #949494"
          _focus={{ borderColor: "blue.500", bg: "white" }}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            setIsListVisible(true);
          }}
          onBlur={() => {
            // Delay updating focus so dropdown item onClick handlers can still execute
            setTimeout(() => {
              setIsFocused(false);
              setIsListVisible(false);
            }, 200);
          }}
        />
      </Group>

      {isListVisible && results.length > 0 && (
        <VStack
          position="absolute"
          top="110%"
          left="0"
          width="full"
          bg="white"
          boxShadow="lg"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.200"
          zIndex="2000"
          overflow="hidden"
          align="stretch"
          gap="0"
        >
          {results.map((result, index) => (
            <Box
              key={index}
              p="3"
              cursor="pointer"
              _hover={{ bg: "gray.100" }}
              borderBottom={index !== results.length - 1 ? "1px solid" : "none"}
              borderColor="gray.100"
              onClick={() => {
                setSearchValue(result.properties.name);
                setIsListVisible(false);
                if (type === "origin") {
                  dispatch(
                    setOrigin([
                      result.geometry.coordinates[1],
                      result.geometry.coordinates[0],
                    ])
                  );
                } else {
                  dispatch(
                    setDestination([
                      result.geometry.coordinates[1],
                      result.geometry.coordinates[0],
                    ])
                  );
                }
              }}
            >
              <Text fontWeight="bold" fontSize="sm" color="black">
                {result.properties.name}
              </Text>
              <Text fontSize="xs" color="gray.600">
                {result.properties.city}, {result.properties.country}
              </Text>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};