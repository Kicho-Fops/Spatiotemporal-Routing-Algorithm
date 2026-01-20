import { createSlice } from "@reduxjs/toolkit";

const RouteCoordinatesSlice = createSlice({
  name: "routeCoordinates",
  initialState: {
    routes: [],
  },
  reducers: {
    setRoute: (state, action) => {
      state.routes = action.payload;
    //   console.log("Action payload:", action.payload);
    //   console.log("State after update:", state.routes);
    //   console.log(
    //     "Updated calculated route to:",
    //     state.routes.route_coords[0].route_index,
    //     state.routes.route_coords[0].weight_type,
    //     state.routes.route_coords[0].duration,
    //     state.routes.route_coords[0].distance,
    //     state.routes.route_coords[0].rain_exposure,
    //     state.routes.route_coords[0].wind_exposure,
    //     state.routes.route_coords[0].heat_exposure,
    //     state.routes.route_coords[0].humidity_exposure,
    //   );
    },
  },
});

const { setRoute } = RouteCoordinatesSlice.actions;
export { setRoute };
export default RouteCoordinatesSlice.reducer;
