import { createSlice } from "@reduxjs/toolkit";
import { Route } from "lucide-react";

const ConfigurationSlice = createSlice({
  name: "configuration",
  initialState: {
    RouteType: 1,
    weatherSelected: [""],
    numberOfPaths: 1,
    rainWeight: 0.85834,
    windWeight: 0.0285,
    tempWeight: 0.09648,
    humWeight: 0.01668,
  },
  reducers: {
    setRouteType: (state, action) => {
      state.RouteType = action.payload;
      // console.log("Updated RouteType:", state.RouteType);
    },
    setWeatherSelected: (state, action) => {
      const masterOrder = ["rain", "heat", "humidity", "wind"];

      state.weatherSelected = masterOrder.filter((item) =>
        action.payload.includes(item),
      );

      // if (selectedWeather?.includes("rain")) activeWeights.push(rainWeight);
      //     if (selectedWeather?.includes("heat")) activeWeights.push(tempWeight);
      //     if (selectedWeather?.includes("humidity")) activeWeights.push(humWeight);
      //     if (selectedWeather?.includes("wind")) activeWeights.push(windWeight);

      // console.log("Updated weatherSelected:", state.weatherSelected);
    },
    setRainWeight: (state, action) => {
      state.rainWeight = action.payload;
      // console.log("Updated rainWeight:", state.rainWeight);
    },
    setWindWeight: (state, action) => {
      state.windWeight = action.payload;
    },
    setTempWeight: (state, action) => {
      state.tempWeight = action.payload;
    },
    setHumWeight: (state, action) => {
      state.humWeight = action.payload;
    },
    setNumberOfPaths: (state, action) => {
      state.numberOfPaths = action.payload;
      console.log("Updated numberOfPaths:", state.numberOfPaths);
    },
  },
});

const {
  setRouteType,
  setWeatherSelected,
  setRainWeight,
  setWindWeight,
  setTempWeight,
  setHumWeight,
  setNumberOfPaths,
} = ConfigurationSlice.actions;
export {
  setRouteType,
  setWeatherSelected,
  setRainWeight,
  setWindWeight,
  setTempWeight,
  setHumWeight,
  setNumberOfPaths,
};
export default ConfigurationSlice.reducer;
