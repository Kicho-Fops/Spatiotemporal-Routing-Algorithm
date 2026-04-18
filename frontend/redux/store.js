import { configureStore } from "@reduxjs/toolkit";
import CoordinatesReducer from "./slices/coordinates";
import ConfigurationReducer from "./slices/configuration"
import RouteCoordinatesReducer from './slices/routeCoordinates'
import SpecificationReducer from './slices/specification'

const store = configureStore({
  reducer: {
    Coordinates: CoordinatesReducer,
    Configuration: ConfigurationReducer,
    Route: RouteCoordinatesReducer,
    Specification: SpecificationReducer,
  },
})

export default store
