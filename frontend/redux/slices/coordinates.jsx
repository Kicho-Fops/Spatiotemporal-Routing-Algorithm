import { createSlice } from "@reduxjs/toolkit"; 

const CoordinatesSlice = createSlice({
  name: "coordinates",
  initialState: {
    origin: [null, null],
    destination: [null, null],
  },
  reducers: {
    setOrigin: (state, action) => {
      state.origin = action.payload;
      console.log("Origin set to:", state.origin);
    },
    setDestination: (state, action) => {
      state.destination = action.payload;
        console.log("Destination set to:", state.destination);
    },
  },
});

export const { setOrigin, setDestination } = CoordinatesSlice.actions;
export default CoordinatesSlice.reducer;