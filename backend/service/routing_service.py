import os
from .load_static import DataManager, DataLoader
from .calculate_isochrones import calculate_isochrones
from .weight_calculation import GNN_weight_calculations

import dotenv
import networkx as nx
import osmnx as ox
from networkx.readwrite import json_graph
from shapely.geometry import LineString


_data_loader = None

def get_data_manager(time=17):
    """
    Get or create the singleton DataLoader instance.
    """
    global _data_manager
    if _data_manager is None:
        _data_manager = DataManager(time=time)

    return _data_manager

    
    
    
def calculate_route(datafile, 
                    origin, 
                    destination,
                    map_view_mode, 
                    K_variable_paths,
                    route_conditions,
                    route_weights,
                    time,
                    Graph_name):
    
    """
    PREREQUISITE:
    1. .env is configures with data that will modify the route
    
    DESCRIPTION:
    1. Check for the DataLoader class to be initialized. The DataLoader class will load the map 
    2. Modify the map routes based on user specified conditions and weights such as weather or traffic conditions.
    
    OUTPUT:
    calculate_weather_route will return a collection of arrays which contain coordinates which represent the K best routes given the user specified conditions and weights.     

    It is assumed that the route condition data is locatable by the backend, if you wish to customize this behavior to, for example send a specific file path or 
    send the route condition data directly, please modify the backend accordingly. 
    
    In the default case, weather data is loaded from the .env file, as specified in the README.md

    """

    # Load the base map

    GraphManager = DataManager(time=time)
    
    GraphLoader = GraphManager.load_graph(Graph_name, datafile)
    # Set custom lat/lon bounds for the loaded graph
    GraphLoader.lat_min, GraphLoader.lat_max, GraphLoader.lon_min, GraphLoader.lon_max = 41.61, 42.04, -88.03, -87.30 # For Chicago
    
    
    origin = (float(origin['lat']), float(origin['lon']))
    destination = (float(destination['lat']), float(destination['lon']))

    # Validate Origin 
    if not (GraphLoader.lat_min <= origin[0] <= GraphLoader.lat_max and 
            GraphLoader.lon_min <= origin[1] <= GraphLoader.lon_max):
        raise ValueError(f"Origin {origin} is outside the graph bounds.")

    # Validate Destination
    if not (GraphLoader.lat_min <= destination[0] <= GraphLoader.lat_max and 
            GraphLoader.lon_min <= destination[1] <= GraphLoader.lon_max):
        raise ValueError(f"Destination {destination} is outside the graph bounds.")
    
    
    # Load more maps
    
    # AnotherLoader = GraphManager.load_graph("AnotherCity", another_datafile)
    
    
    # Calculate isochrones
    
    orig_node = ox.distance.nearest_nodes(GraphLoader.G, X=origin[1], Y=origin[0])
    dest_node = ox.distance.nearest_nodes(GraphLoader.G, X=destination[1], Y=destination[0])
    print("Obtained valid origin and destination nodes.")

    # Calculate isochrones

    route = nx.shortest_path(GraphLoader.G, orig_node, dest_node, weight="travel_time")
    trip_times_seconds = calculate_isochrones(GraphLoader.G, orig_node, route)
    
    # Load modifier data for each map
    
    dotenv.load_dotenv()
    
    
    rain_data, rain_lats, rain_lons, rain_ds = GraphLoader.load_rain_data(
        rain_data_path= os.getenv("BASE_DATA_DIR") + "RAIN.nc"
    )
    
    heat_data, heat_lats, heat_lons, heat_ds = GraphLoader.load_heat_index_data(
        heat_index_path= os.getenv("BASE_DATA_DIR") + "T2.nc"
    )
    wind_speed_data, wind_dir_data, wind_lats, wind_lons, wind_speed_ds, wind_dir_ds = GraphLoader.load_wind_data(
        wind_speed_path= os.getenv("BASE_DATA_DIR") + "WSPD10.nc",
        wind_direction_path= os.getenv("BASE_DATA_DIR") + "WDIR10.nc"
    )
    humidity_data, hum_lats, hum_lons, humidity_ds = GraphLoader.load_relative_humidity_data(
        rh_data_path= os.getenv("BASE_DATA_DIR") + "RH2.nc"
    )
    
    
    
    # Example of an implementation of a generic loader
    # another_data, another_data_lats, another_data_lons, traffic_dsanother_data = GraphLoader.load_NetCDF_data(another_data, 'DATA_VARIABLE_NAME')
    
    if map_view_mode == "Default weights":
        rain_weight = 0.85834
        heat_weight = 0.02850
        humidity_weight = 0.09648
        wind_weight = 0.01657
    # In maps mode we are able to create a (for example) rain + heat aware path, so we need to check that the sum of weights is less than 1.0
    elif map_view_mode == "Custom weights":
        rain_weight = route_weights[0] if "rain" in route_conditions else 0
        heat_weight = route_weights[1] if "heat" in route_conditions else 0
        wind_weight = route_weights[2] if "wind" in route_conditions else 0
        humidity_weight = route_weights[3] if "humidity" in route_conditions else 0
        
        if rain_weight + heat_weight + wind_weight + humidity_weight > 1.0:
            raise ValueError("In 'Maps' mode, the sum of weather weights must be 1.0")
    # In variable mode we just assign the weights as per user input as long as they are between 0 and 1
    else:
        rain_weight = route_weights[0] if "rain" in route_conditions else 0
        heat_weight = route_weights[1] if "heat" in route_conditions else 0
        wind_weight = route_weights[2] if "wind" in route_conditions else 0
        humidity_weight = route_weights[3] if "humidity" in route_conditions else 0
    
        if (rain_weight < 0 or rain_weight > 1 or
            heat_weight < 0 or heat_weight > 1 or
            wind_weight < 0 or wind_weight > 1 or
            humidity_weight < 0 or humidity_weight > 1):
            raise ValueError("In 'Variable' mode, each weather weight must be between 0 and 1.")
        
    GNN_weight_calculations(
        GraphLoader.G, 
        rain_lats, rain_lons,
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
        humidity_weight=humidity_weight
    )
    
    print(f"Calculating routes for map view mode: {map_view_mode}")
    
    routes_data = []
    
    # Single map with single route!! 
    if map_view_mode == "Default weights":
        route_fastest = nx.shortest_path(GraphLoader.G, orig_node, dest_node, weight="travel_time")
        route_total = nx.shortest_path(GraphLoader.G, orig_node, dest_node, weight="total_weight")
        routes_data.append({
                        'route': route_fastest,
                        'weight_type': "fastest-route",
                        'route_index': 0,
                        "distance": nx.path_weight(GraphLoader.G, route_fastest, weight='length') / 1000,  # in km
                        "duration": nx.path_weight(GraphLoader.G, route_fastest, weight='travel_time') / 60,  # in minutes
                        "rain_exposure": nx.path_weight(GraphLoader.G, route_fastest, weight='rain_weight') if 'rain' in route_conditions else 0,
                        "heat_exposure": nx.path_weight(GraphLoader.G, route_fastest, weight='heat_weight') if 'heat' in route_conditions else 0,
                        "wind_exposure": nx.path_weight(GraphLoader.G, route_fastest, weight='wind_weight') if 'wind' in route_conditions else 0,
                        "humidity_exposure": nx.path_weight(GraphLoader.G, route_fastest, weight='humidity_weight') if 'humidity' in route_conditions else 0,
                    })
        routes_data.append({
                        'route': route_total,
                        'weight_type': "weighted-route",
                        'route_index': 1,
                        "distance": nx.path_weight(GraphLoader.G, route_total, weight='length') / 1000,  # in km
                        "duration": nx.path_weight(GraphLoader.G, route_total, weight='travel_time') / 60,  # in minutes
                        "rain_exposure": nx.path_weight(GraphLoader.G, route_total, weight='rain_weight') if 'rain' in route_conditions else 0,
                        "heat_exposure": nx.path_weight(GraphLoader.G, route_total, weight='heat_weight') if 'heat' in route_conditions else 0,
                        "wind_exposure": nx.path_weight(GraphLoader.G, route_total, weight='wind_weight') if 'wind' in route_conditions else 0,
                        "humidity_exposure": nx.path_weight(GraphLoader.G, route_total, weight='humidity_weight') if 'humidity' in route_conditions else 0,    
                    })
    
    elif map_view_mode == "Custom weights":

        # For future reference, the k_shortest_paths and shortest_paths are the ones that acually return a list of osm ID's
        for weight in route_conditions:
            # calculate route optimized for every selected weight
            try:
                print(f"Calculating route optimized for {weight}...")
                # Use Yen's algorithm for k-shortest paths
                k_paths = list(ox.routing.k_shortest_paths(GraphLoader.G, orig_node, dest_node, k=(K_variable_paths), weight=f"{weight}_weight"))
                        
                # Add each route to routes_data which will be processed later
                for i in range(K_variable_paths):
                    route = k_paths[i]
                    routes_data.append({
                        'route': route,
                        'weight_type': "%s-aware-route"%weight,
                        'route_index': i,
                        "distance": nx.path_weight(GraphLoader.G, route, weight='length') / 1000,  # in km
                        "duration": nx.path_weight(GraphLoader.G, route, weight='travel_time') / 60,  # in minutes
                        "rain_exposure": nx.path_weight(GraphLoader.G, route, weight='rain_weight') if 'rain' in route_conditions else 0,
                        "heat_exposure": nx.path_weight(GraphLoader.G, route, weight='heat_weight') if 'heat' in route_conditions else 0,
                        "wind_exposure": nx.path_weight(GraphLoader.G, route, weight='wind_weight') if 'wind' in route_conditions else 0,
                        "humidity_exposure": nx.path_weight(GraphLoader.G, route, weight='humidity_weight') if 'humidity' in route_conditions else 0,    
                    })
                    
            except Exception as e:
                print(f"Could not calculate route for {weight}: {e}")
                    
        route_fastest = nx.shortest_path(GraphLoader.G, orig_node, dest_node, weight="travel_time")
        routes_data.append({
                        'route': route_fastest,
                        'weight_type': "fastest-route",
                        'route_index': 0,
                        "distance": nx.path_weight(GraphLoader.G, route_fastest, weight='length') / 1000,  # in km
                        "duration": nx.path_weight(GraphLoader.G, route_fastest, weight='travel_time') / 60,  # in minutes
                        "rain_exposure": nx.path_weight(GraphLoader.G, route_fastest, weight='rain_weight') if 'rain' in route_conditions else 0,
                        "heat_exposure": nx.path_weight(GraphLoader.G, route_fastest, weight='heat_weight') if 'heat' in route_conditions else 0,
                        "wind_exposure": nx.path_weight(GraphLoader.G, route_fastest, weight='wind_weight') if 'wind' in route_conditions else 0,
                        "humidity_exposure": nx.path_weight(GraphLoader.G, route_fastest, weight='humidity_weight') if 'humidity' in route_conditions else 0,
                    })

        
    # With this you are able to compare a only rain aware path, a only heat aware path and a heat + rain aware path
    elif map_view_mode == "Single-factor weights": 
    
        # For future reference, the k_shortest_paths and shortest_paths are the ones that acually return a list of osm ID's
        i = 1
        for weight in route_conditions:
            # calculate route optimized for every selected weight
            try:
                print(f"Calculating route optimized for {weight}...")
                # Use Yen's algorithm for k-shortest paths
                route = nx.shortest_path(GraphLoader.G, orig_node, dest_node, weight=f"{weight}_weight")
                        
                # Add each route to routes_data which will be processed later
        
                routes_data.append({
                    'route': route,
                    'weight_type': "%s-aware-route"%weight,
                    'route_index': i,
                    "distance": nx.path_weight(GraphLoader.G, route, weight='length') / 1000,  # in km
                    "duration": nx.path_weight(GraphLoader.G, route, weight='travel_time') / 60,  # in minutes
                    "rain_exposure": nx.path_weight(GraphLoader.G, route, weight='rain_weight') if 'rain' in route_weights else 0,
                    "heat_exposure": nx.path_weight(GraphLoader.G, route, weight='heat_weight') if 'heat' in route_weights else 0,
                    "wind_exposure": nx.path_weight(GraphLoader.G, route, weight='wind_weight') if 'wind' in route_weights else 0,
                    "humidity_exposure": nx.path_weight(GraphLoader.G, route, weight='humidity_weight') if 'humidity' in route_weights else 0,    
                    
                })
                i += 1
                
            except Exception as e:
                print(f"Could not calculate route for {weight}: {e}")
                    
        route_fastest = nx.shortest_path(GraphLoader.G, orig_node, dest_node, weight="travel_time")
        routes_data.append({
            'route': route_fastest,
            'route_index': 0,
            'weight_type': 'fastest-route',
            "distance": nx.path_weight(GraphLoader.G, route_fastest, weight='length') / 1000,  # in km
            "duration": nx.path_weight(GraphLoader.G, route_fastest, weight='travel_time') / 60,  # in minutes
            "rain_exposure": nx.path_weight(GraphLoader.G, route_fastest, weight='rain_weight') if 'rain' in route_weights else 0,
            "heat_exposure": nx.path_weight(GraphLoader.G, route_fastest, weight='heat_weight') if 'heat' in route_weights else 0,
            "wind_exposure": nx.path_weight(GraphLoader.G, route_fastest, weight='wind_weight') if 'wind' in route_weights else 0,
            "humidity_exposure": nx.path_weight(GraphLoader.G, route_fastest, weight='humidity_weight') if 'humidity' in route_weights else 0,
        })
        
    # instead we will create linestrings and store to geojson. Then fetch it on frontend whenever needed.
    route_coords = []
    index = 0
    for route in routes_data:
        route_data_coords = []
        for node_id in route['route']:
            node = GraphLoader.G.nodes[node_id]
            route_data_coords.append((node['y'], node['x']))
        route_coords.append({
            'route_index': index,
            'weight_type': route['weight_type'],
            'coordinates': route_data_coords
        })
        index += 1

    return route_coords
    
    
def get_graph(Graph_name, datafile, time) -> nx.MultiDiGraph:
    GraphManager = DataManager(time=time)
    
    GraphLoader = GraphManager.load_graph(Graph_name, datafile)
    # Set custom lat/lon bounds for the loaded graph
    GraphLoader.lat_min, GraphLoader.lat_max, GraphLoader.lon_min, GraphLoader.lon_max = 41.61, 42.04, -88.03, -87.30

    for u, v, k, data in GraphLoader.G.edges(data=True, keys=True):
        if 'geometry' in data:
            # Option A: Convert to a list of (x, y) tuples
            if isinstance(data['geometry'], LineString):
                data['geometry'] = list(data['geometry'].coords)
    
    
    return nx.node_link_data(GraphLoader.G)