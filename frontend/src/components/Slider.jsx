import React, { useState } from "react";
import { Slider, Stack } from "@chakra-ui/react";

function SliderCustom({element, startingValue}) {
  // En v3, el valor suele ser un array [number]
  const [value, setValue] = useState([startingValue]);

  return (
    <Stack>
      <Slider.Root 
        value={value} 
        onValueChange={(details) => setValue(details.value)}
        min={0}
        max={1}
        step={0.01}
        p={3}
      >
        <Slider.Label mb="2">{element}: {value}</Slider.Label>
        
        <Slider.Control>
          <Slider.Track>
            <Slider.Range />
          </Slider.Track>
          <Slider.Thumb index={0} />

          <Slider.MarkerGroup>
            <Slider.Marker value={0.25} p={4}>0.25</Slider.Marker>
            <Slider.Marker value={0.5} p={4}>0.5</Slider.Marker>
            <Slider.Marker value={0.75} p={4}>0.75</Slider.Marker>
          </Slider.MarkerGroup>
        </Slider.Control>
        
      </Slider.Root>
    </Stack>
  );
}

export default SliderCustom;