import osmnx as ox
import networkx as nx
import geopandas as gpd
from backend.service.load_static import DataLoader
from backend.service.calculate_isochrones import calculate_isochrones
from weight_calculation import GNN_weight_calculations
from datetime import datetime
from shapely.geometry import LineString, mapping
import json
import os
from collections import defaultdict
import pandas as pd




def time_to_global_index(time_string, start_time):
    # convert string to datetime
    dt = datetime.strptime(time_string, "%Y-%m-%dT%H:%M:%S")
    
    # difference in minutes
    diff_minutes = int((dt - start_time).total_seconds() // 60)
    
    # index = 1, 2, 3, ... every 15 minutes
    index = diff_minutes // 15 + 1
    
    return index

# ...existing code...

def calculate_weather_route(
    datafile: str,
    origin: dict,
    destination: dict,
    mode: str = "Default weights",
    K: int = 1,
    route_conditions: list[str] | None = None,
    route_weights: list[float] | None = None,
    time: float = 17,
    dataloader: DataLoader = None,
):
    """
    Calculate one or more weather-aware routes between an origin and destination.

    Parameters
    ----------
    datafile : str
        Name of the city graph to load (e.g. "chicago" for "chicago.graphml").
    origin : dict
        Origin point as a mapping containing "lat" and "lon" keys (float).
    destination : dict
        Destination point as a mapping containing "lat" and "lon" keys (float).
    mode : {"Default weights", "Custom weights", "Single-factor weights"}, optional
        Routing mode:
          * "Default weights": use built-in weather weights and output
            fastest route + globally weighted route.
          * "Custom weights": use the user-provided weights in
            `route_conditions` / `route_weights` and compute K shortest
            paths per active factor.
          * "Single-factor weights": compute one shortest path per active
            condition, plus the fastest route (by travel time).
    K : int, optional
        Number of alternative paths per condition in "Custom weights"
        mode (k-shortest paths). Ignored in other modes.
    route_conditions : list of str, optional
        List of conditions to consider (e.g. ["rain", "heat"]). Must align
        by index with `route_weights` when provided.
    route_weights : list of float, optional
        Weights corresponding to each entry in `route_conditions`. Values
        are typically in [0, 1].
    time : float, optional
        Time index used to select the appropriate weather slice in the
        underlying datasets.

    Raises
    ------
    ValueError
        If origin/destination lie outside the loaded graph bounds, if the sum
        of custom weights exceeds 1.0, or if any variable-mode weight is
        outside [0, 1].

    Side Effects
    ------------
    Writes per-route metric CSV files to "./data/served/metric/" and route
    GeoJSONs (including origin/destination points) to "./data/served/vector/".

    Returns
    -------
    A collection of 
    """
    # ...existing code...

    BASE_PATH = "./data/weather/"
    input_path = "./data/served/vector/%s_roads.geojson" % input
    # get ymin, ymax, xmin, xmax from bbox from input

    # bbox from input area file: -87.6600, 41.8600, -87.6000, 41.9000

    # datafile: chicago, 
    # input: baselayer-0, 
    # origin_: {'lat': 41.87044, 'lon': -87.626412} 
    # destination_: {'lat': 41.891375, 'lon': -87.630202}
    # map_view_mode: 'Default weights',
    # K_variable_paths: 1,
    # time_ : '2025-07-06T00:00:00',
    # rain: 0.85834,
    # heat: 0.02850,
    # wind: 0.01657,
    # humidity: 0.09648

    # Gives keyerror: length ....

    # Other OD pairs tested: 
    # (1):
    # origin_: {'lat': 41.884573, 'lon': -87.652446}, destination_: {'lat': 41.889618, 'lon': -87.622991}
    # 1000 West Randolph Street to 401 North Michigan Avenue
    # keyerror: length ...

    # (2):
    # origin_: {'lat': 41.890233, 'lon': -87.637435}
    # destination_: {'lat': 41.868464, 'lon': -87.624666}
    # 350 West Hubbard Street to 1130 South Michigan Avenue
    # No path error
    
    gdf = gpd.read_file(input_path)
    # xmin, ymin, xmax, ymax = [-87.6600, 41.8600, -87.6000, 41.9000]
    xmin, ymin, xmax, ymax = gdf.total_bounds
    # ymax = bbox[0] 
    # ymin = bbox[1]
    # xmax = bbox[2]
    # xmin = bbox[3]
    bbox = [ymax, ymin, xmax, xmin]

    weather_conditions = []
    weather_weights = []

    origin = (float(origin['lat']), float(origin['lon']))
    destination = (float(destination['lat']), float(destination['lon']))

    if (origin[0] < ymin or origin[1] >     ymax or 
        origin[1] < xmin or origin[1] > xmax or
        destination[0] < ymin or destination[0] > ymax or
        destination[1] < xmin or destination[1] > xmax):
            raise ValueError("Origin point is outside the loaded graph bounds.")
    
    if dataloader is None:
        Exception("DataLoader instance must be provided to load map and weather data.")
    
    # Load the dataset
    G = dataloader.G

    # Obtain valid origin and destination points
    orig_node = ox.distance.nearest_nodes(G, X=origin[1], Y=origin[0])
    dest_node = ox.distance.nearest_nodes(G, X=destination[1], Y=destination[0])
    print("Obtained valid origin and destination nodes.")

    # Calculate isochrones

    route = nx.shortest_path(G, orig_node, dest_node, weight="travel_time")
    trip_times_seconds = calculate_isochrones(G, orig_node, route)

    # In the optimized mode we always use the default weights
    if mode == "Default weights":
        rain_weight = 0.85834
        heat_weight = 0.02850
        humidity_weight = 0.09648
        wind_weight = 0.01657
    # In maps mode we are able to create a (for example) rain + heat aware path, so we need to check that the sum of weights is less than 1.0
    elif mode == "Custom weights":
        rain_weight = weather_weights[weather_conditions.index('rain')] if 'rain' in weather_conditions else 0
        heat_weight = weather_weights[weather_conditions.index('heat')] if 'heat' in weather_conditions else 0
        wind_weight = weather_weights[weather_conditions.index('wind')] if 'wind' in weather_conditions else 0
        humidity_weight = weather_weights[weather_conditions.index('humidity')] if 'humidity' in weather_conditions else 0
        if sum(weather_weights) > 1.0:
            raise ValueError("In 'Maps' mode, the sum of weather weights must be 1.0")
    # In variable mode we just assign the weights as per user input as long as they are between 0 and 1
    else:
        rain_weight = weather_weights[weather_conditions.index('rain')] if 'rain' in weather_conditions else 0
        heat_weight = weather_weights[weather_conditions.index('heat')] if 'heat' in weather_conditions else 0
        wind_weight = weather_weights[weather_conditions.index('wind')] if 'wind' in weather_conditions else 0
        humidity_weight = weather_weights[weather_conditions.index('humidity')] if 'humidity' in weather_conditions else 0
        
        if (rain_weight < 0 or rain_weight > 1 or
            heat_weight < 0 or heat_weight > 1 or
            wind_weight < 0 or wind_weight > 1 or
            humidity_weight < 0 or humidity_weight > 1):
            raise ValueError("In 'Variable' mode, each weather weight must be between 0 and 1.")
    
    GNN_weight_calculations(G, rain_lats, rain_lons,
                            rain_ds=rain_ds,
                            heat_ds=heat_ds,
                            wind_speed_ds=wind_speed_ds,
                            wind_dir_ds=wind_dir_ds,
                            humidity_ds=humidity_ds,
                            rain_data=rain_data,
                            heat_data=heat_data,
                            wind_speed_data=wind_speed_data,
                            wind_dir_data=wind_dir_data,
                            humidity_data=humidity_data,
                            time=time,
                            trip_time_seconds=trip_times_seconds,
                            rain_weight=rain_weight,
                            heat_weight=heat_weight,
                            wind_weight=wind_weight,
                            humidity_weight=humidity_weight)
    
    routes_data = []
    
    print(f"Calculating routes for map view mode: {mode}")
    
    # Single map with single route!! 
    if mode == "Default weights":
        route_fastest = nx.shortest_path(G, orig_node, dest_node, weight="travel_time")
        route_total = nx.shortest_path(G, orig_node, dest_node, weight="total_weight")
        routes_data.append({
                        'route': route_fastest,
                        'weight_type': "fastest-route",
                        'route_index': 0,
                        "distance": nx.path_weight(G, route_fastest, weight='length') / 1000,  # in km
                        "duration": nx.path_weight(G, route_fastest, weight='travel_time') / 60,  # in minutes
                        "rain_exposure": nx.path_weight(G, route_fastest, weight='rain_weight') if 'rain' in weather_conditions else 0,
                        "heat_exposure": nx.path_weight(G, route_fastest, weight='heat_weight') if 'heat' in weather_conditions else 0,
                        "wind_exposure": nx.path_weight(G, route_fastest, weight='wind_weight') if 'wind' in weather_conditions else 0,
                        "humidity_exposure": nx.path_weight(G, route_fastest, weight='humidity_weight') if 'humidity' in weather_conditions else 0,
                    })
        routes_data.append({
                        'route': route_total,
                        'weight_type': "weighted-route",
                        'route_index': 1,
                        "distance": nx.path_weight(G, route_total, weight='length') / 1000,  # in km
                        "duration": nx.path_weight(G, route_total, weight='travel_time') / 60,  # in minutes
                        "rain_exposure": nx.path_weight(G, route_total, weight='rain_weight') if 'rain' in weather_conditions else 0,
                        "heat_exposure": nx.path_weight(G, route_total, weight='heat_weight') if 'heat' in weather_conditions else 0,
                        "wind_exposure": nx.path_weight(G, route_total, weight='wind_weight') if 'wind' in weather_conditions else 0,
                        "humidity_exposure": nx.path_weight(G, route_total, weight='humidity_weight') if 'humidity' in weather_conditions else 0,    
                    })
    
    elif mode == "Custom weights":

        # For future reference, the k_shortest_paths and shortest_paths are the ones that acually return a list of osm ID's
        for weight in weather_conditions:
            # calculate route optimized for every selected weight
            try:
                print(f"Calculating route optimized for {weight}...")
                # Use Yen's algorithm for k-shortest paths
                k_paths = list(ox.routing.k_shortest_paths(G, orig_node, dest_node, k=(K), weight=f"{weight}_weight"))
                        
                # Add each route to routes_data which will be processed later
                for i in range(K):
                    route = k_paths[i]
                    routes_data.append({
                        'route': route,
                        'weight_type': "%s-aware-route"%weight,
                        'route_index': i,
                        "distance": nx.path_weight(G, route, weight='length') / 1000,  # in km
                        "duration": nx.path_weight(G, route, weight='travel_time') / 60,  # in minutes
                        "rain_exposure": nx.path_weight(G, route, weight='rain_weight') if 'rain' in weather_conditions else 0,
                        "heat_exposure": nx.path_weight(G, route, weight='heat_weight') if 'heat' in weather_conditions else 0,
                        "wind_exposure": nx.path_weight(G, route, weight='wind_weight') if 'wind' in weather_conditions else 0,
                        "humidity_exposure": nx.path_weight(G, route, weight='humidity_weight') if 'humidity' in weather_conditions else 0,    
                    })
                    
            except Exception as e:
                print(f"Could not calculate route for {weight}: {e}")
                    
        route_fastest = nx.shortest_path(G, orig_node, dest_node, weight="travel_time")
        routes_data.append({
                        'route': route_fastest,
                        'weight_type': "fastest-route",
                        'route_index': 0,
                        "distance": nx.path_weight(G, route_fastest, weight='length') / 1000,  # in km
                        "duration": nx.path_weight(G, route_fastest, weight='travel_time') / 60,  # in minutes
                        "rain_exposure": nx.path_weight(G, route_fastest, weight='rain_weight') if 'rain' in weather_conditions else 0,
                        "heat_exposure": nx.path_weight(G, route_fastest, weight='heat_weight') if 'heat' in weather_conditions else 0,
                        "wind_exposure": nx.path_weight(G, route_fastest, weight='wind_weight') if 'wind' in weather_conditions else 0,
                        "humidity_exposure": nx.path_weight(G, route_fastest, weight='humidity_weight') if 'humidity' in weather_conditions else 0,
                    })

        
    # With this you are able to compare a only rain aware path, a only heat aware path and a heat + rain aware path
    elif mode == "Single-factor weights": 
    
        # For future reference, the k_shortest_paths and shortest_paths are the ones that acually return a list of osm ID's
        i = 1
        for weight in weather_conditions:
            # calculate route optimized for every selected weight
            try:
                print(f"Calculating route optimized for {weight}...")
                # Use Yen's algorithm for k-shortest paths
                route = nx.shortest_path(G, orig_node, dest_node, weight=f"{weight}_weight")
                        
                # Add each route to routes_data which will be processed later
        
                routes_data.append({
                    'route': route,
                    'weight_type': "%s-aware-route"%weight,
                    'route_index': i,
                    "distance": nx.path_weight(G, route, weight='length') / 1000,  # in km
                    "duration": nx.path_weight(G, route, weight='travel_time') / 60,  # in minutes
                    "rain_exposure": nx.path_weight(G, route, weight='rain_weight') if 'rain' in weather_conditions else 0,
                    "heat_exposure": nx.path_weight(G, route, weight='heat_weight') if 'heat' in weather_conditions else 0,
                    "wind_exposure": nx.path_weight(G, route, weight='wind_weight') if 'wind' in weather_conditions else 0,
                    "humidity_exposure": nx.path_weight(G, route, weight='humidity_weight') if 'humidity' in weather_conditions else 0,    
                    
                })
                i += 1
                
            except Exception as e:
                print(f"Could not calculate route for {weight}: {e}")
                    
        route_fastest = nx.shortest_path(G, orig_node, dest_node, weight="travel_time")
        routes_data.append({
            'route': route_fastest,
            'route_index': 0,
            'weight_type': 'fastest-route',
            "distance": nx.path_weight(G, route_fastest, weight='length') / 1000,  # in km
            "duration": nx.path_weight(G, route_fastest, weight='travel_time') / 60,  # in minutes
            "rain_exposure": nx.path_weight(G, route_fastest, weight='rain_weight') if 'rain' in weather_conditions else 0,
            "heat_exposure": nx.path_weight(G, route_fastest, weight='heat_weight') if 'heat' in weather_conditions else 0,
            "wind_exposure": nx.path_weight(G, route_fastest, weight='wind_weight') if 'wind' in weather_conditions else 0,
            "humidity_exposure": nx.path_weight(G, route_fastest, weight='humidity_weight') if 'humidity' in weather_conditions else 0,
        })
        
    # instead we will create linestrings and store to geojson. Then fetch it on frontend whenever needed.
    route_coords = []
    index = 0
    for route in routes_data:
        route_data_coords = []
        for node_id in route['route']:
            node = G.nodes[node_id]
            route_data_coords.append((node['y'], node['x']))
        route_coords.append({
            'route_index': index,
            'weight_type': route['weight_type'],
            'coordinates': route_data_coords
        })
        index += 1

    return route_coords
