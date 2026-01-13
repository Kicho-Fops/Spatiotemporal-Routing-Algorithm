import { configureStore } from "@reduxjs/toolkit";
import CoordinatesReducer from "./slices/coordinates";

const store = configureStore({
  reducer: {
    Coordinates: CoordinatesReducer,
  },
})

export default store
