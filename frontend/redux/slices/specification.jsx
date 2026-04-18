import { createSlice } from "@reduxjs/toolkit";

const SpecificationSlice = createSlice({
  name: "specification",
  initialState: {
    specifications: [],
  },
  reducers: {
    setSpecification: (state, action) => {
      state.specifications = action.payload;
      // console.log("Updated specifications:", state.specifications);
    },
  },
});
export const { setSpecification } = SpecificationSlice.actions;
export default SpecificationSlice.reducer;
