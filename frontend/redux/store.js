import { configureStore } from "@reduxjs/toolkit";
import CoordinatesReducer from "./slices/coordinates";
import ConfigurationReducer from "./slices/configuration"

const store = configureStore({
  reducer: {
    Coordinates: CoordinatesReducer,
    Configuration: ConfigurationReducer
  },
})

export default store
