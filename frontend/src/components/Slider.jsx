import React, { useState } from "react";
import { Slider, Stack } from "@chakra-ui/react";

function SliderCustom({element, startingValue, onChange }) {
  // En v3, el valor suele ser un array [number]
   const sliderValue = [startingValue];

  return (
    <Stack>
      <Slider.Root 
        value={sliderValue} 
        
        onValueChange={(details) => {
          onChange(details.value[0]); 
        }}
       
        min={0}
        max={1}
        step={0.01}
        p={3}
      >
        <Slider.Label mb="2">{element}: {sliderValue[0]}</Slider.Label>
        
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