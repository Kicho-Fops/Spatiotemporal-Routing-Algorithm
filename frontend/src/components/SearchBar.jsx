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
  const dispatch = useDispatch();

  const [debounceSearchValue] = useDebounce(searchValue, 300);

  // Watch for changes in Redux (e.g., when the user clicks the map)
  // and update the text input automatically
  useEffect(() => {
    if (type === "origin" && (origin[0] !== 0 || origin[1] !== 0)) {
      setSearchValue(`${origin[0].toFixed(5)}, ${origin[1].toFixed(5)}`);
    } else if (type === "destination" && (destination[0] !== 0 || destination[1] !== 0)) {
      setSearchValue(`${destination[0].toFixed(5)}, ${destination[1].toFixed(5)}`);
    }
  }, [origin, destination, type]);

  useEffect(() => {
    const fetchData = async () => {
      // Avoid fetching if the user didn't type a string
      if (!debounceSearchValue || debounceSearchValue.length < 3 || debounceSearchValue.includes(",")) {
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
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setIsListVisible(true)}
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