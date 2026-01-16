import { createSlice } from "@reduxjs/toolkit"; 
import { Route } from "lucide-react";

const ConfigurationSlice = createSlice({
  name: "configuration",
  initialState: {
    RouteType: 1,
    weatherSelected: [""],
    rainWeight: 0.5,
    windWeight: 0.5,
    tempWeight: 0.5,
    humWeight: 0.5,

    },
    reducers: {
    setRouteType: (state, action) => {
      state.RouteType = action.payload;
      // console.log("Updated RouteType:", state.RouteType);
    },
    setWeatherSelected: (state, action) => {
      state.weatherSelected = action.payload;
      // console.log("Updated weatherSelected:", state.weatherSelected);
    },
    setRainWeight: (state, action) => {
      state.rainWeight = action.payload;
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
  },
});

const { setRouteType, setWeatherSelected, setRainWeight, setWindWeight, setTempWeight, setHumWeight } = ConfigurationSlice.actions;
export { setRouteType, setWeatherSelected, setRainWeight, setWindWeight, setTempWeight, setHumWeight };
export default ConfigurationSlice.reducer;
