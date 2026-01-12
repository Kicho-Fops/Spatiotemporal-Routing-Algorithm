import React, { useState, useEffect } from "react";
import { 
  Button, 
  Input, 
  Group, 
  InputElement, 
  Box, 
  List, 
  Text,
  VStack 
} from "@chakra-ui/react";
import { Search, MapPin } from "lucide-react";
import { useDebounce } from "use-debounce"; 

export const SearchBar = ({ PlaceholderText }) => {
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState([]);
  const [isListVisible, setIsListVisible] = useState(false);


  const [debounceSearchValue] = useDebounce(searchValue, 300);

  useEffect(() => {
    const fetchData = async () => {
      if (debounceSearchValue.length < 3) {
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
          placeholder={PlaceholderText}
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
                console.log("Coordenadas seleccionadas:", result.geometry.coordinates);
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