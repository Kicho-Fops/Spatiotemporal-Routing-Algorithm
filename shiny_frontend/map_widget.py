
import osmnx as ox
import networkx as nx
import matplotlib.colors as mcolors
from ipyleaflet import Polyline, Popup
import ipywidgets as widgets


def calculate_and_display_route(G, orig_node, dest_node, m, weather_metrics, fastest_metrics, selected_weights, k_routes = 1):
    """
    Calculate and display multiple routes: one optimized for each weight type plus the fastest route.
    
    Args:
        G: Graph
        orig_node: Origin node
        dest_node: Destination node
        m: Map widget
        weather_metrics: Reactive value for weather route metrics
        fastest_metrics: Reactive value for fastest route metrics
        selected_weights: List of weight types (e.g., ['rain', 'heat', 'wind', 'humidity'])
    """
    
    
    try:
        weight_colormaps = {
            'rain': mcolors.LinearSegmentedColormap.from_list('rain', ['#00ff00', '#00ffff', '#0000ff']),  
            'heat': mcolors.LinearSegmentedColormap.from_list('heat', ['#ffff00', '#ff8c00', '#ff0000']),  
            'wind': mcolors.LinearSegmentedColormap.from_list('wind', ['#90ee90', '#228b22', '#006400']),  
            'humidity': mcolors.LinearSegmentedColormap.from_list('humidity', ['#ffa500', '#ff4500', '#8b0000']),  
            'fastest': mcolors.LinearSegmentedColormap.from_list('fastest', ["#000000", '#000000', '#000000'])  
        }
        
        if k_routes > 3: # This number is arbitrary, just to avoid cluttering the map
            print("WARNING: k_routes must be at most 3 to show alternatives.")
            k_routes = 3
        
        routes_data = []
 
       
        
        for weight in selected_weights:
            # calculate route optimized for every selected weight
            try:
                print(f"Calculating route optimized for {weight}...")
                # Use Yen's algorithm for k-shortest paths
                k_paths = list(ox.routing.k_shortest_paths(G, orig_node, dest_node, k=(k_routes if len(selected_weights) == 1 else 2), weight=f"{weight}_weight"))
                        
                # Add each route to routes_data which will be processed later
                for i in range(k_routes):
                    route = k_paths[i]
                    routes_data.append({
                        'route': route,
                        'weight_type': weight,
                        'is_fastest': False,
                        'route_index': i
                    })
                    
            except Exception as e:
                print(f"Could not calculate route for {weight}: {e}")
                    
        route_fastest = nx.shortest_path(G, orig_node, dest_node, weight="travel_time")
        routes_data.append({
            'route': route_fastest,
            'weight_type': 'fastest',
            'is_fastest': True
        })
        if routes_data:
            primary_route = routes_data[0]['route']
            
            # Obtain overall metrics for the primary route (first in the list)
            # Path weight is used to calculate the sum of weights along the route, which is later displayed on above the map in the UI
            distance = nx.path_weight(G, primary_route, weight='length') / 1000  # in km
            duration = nx.path_weight(G, primary_route, weight='travel_time') / 60  # in minutes
            rain_exposure = nx.path_weight(G, primary_route, weight='rain_weight') if 'rain' in selected_weights else 0
            heat_exposure = nx.path_weight(G, primary_route, weight='heat_weight') if 'heat' in selected_weights else 0
            wind_exposure = nx.path_weight(G, primary_route, weight='wind_weight') if 'wind' in selected_weights else 0
            humidity_exposure = nx.path_weight(G, primary_route, weight='humidity_weight') if 'humidity' in selected_weights else 0

            weather_metrics.set({
                'distance': distance,
                'duration': duration,
                'rain': rain_exposure,
                'heat': heat_exposure,
                'wind': wind_exposure,
                'humidity': humidity_exposure
            })
        
        # Obtain overall metrics for the fastest route
        fastest_distance = nx.path_weight(G, route_fastest, weight='length') / 1000
        fastest_duration = nx.path_weight(G, route_fastest, weight='travel_time') / 60
        fastest_rain = nx.path_weight(G, route_fastest, weight='rain_weight') if 'rain' in selected_weights else 0
        fastest_heat = nx.path_weight(G, route_fastest, weight='heat_weight') if 'heat' in selected_weights else 0
        fastest_wind = nx.path_weight(G, route_fastest, weight='wind_weight') if 'wind' in selected_weights else 0
        fastest_humidity = nx.path_weight(G, route_fastest, weight='humidity_weight') if 'humidity' in selected_weights else 0

        fastest_metrics.set({
            'distance': fastest_distance,
            'duration': fastest_duration,
            'rain': fastest_rain,
            'heat': fastest_heat,
            'wind': fastest_wind,
            'humidity': fastest_humidity
        })


        for route_info in routes_data:
            route = route_info['route']
            weight_type = route_info['weight_type']
            is_fastest = route_info['is_fastest']
            route_index = route_info.get('route_index', 0)
            
            
            rain_values = []
            heat_values = []
            wind_values = []
            humidity_values = []
            weight_values = []
            wind_dir_values = []
            
            # Obtain edge weights for coloring and popup
            for u, v in zip(route[:-1], route[1:]):
                edge_data = G.get_edge_data(u, v)
                if isinstance(edge_data, dict):
                    k0 = list(edge_data.keys())[0]
                    rain_values.append(edge_data[k0].get('rain_weight', 0))
                    heat_values.append(edge_data[k0].get('heat_weight', 0))
                    wind_values.append(edge_data[k0].get('wind_weight', 0))
                    wind_dir_values.append(edge_data[k0].get('wind_dir_weight', 0))
                    humidity_values.append(edge_data[k0].get('humidity_weight', 0))
                    
                    
                    if is_fastest:
                        weight_values.append(edge_data[k0].get('travel_time', 0))
                    else:
                        weight_values.append(edge_data[k0].get(f'{weight_type}_weight', 0))
                else:
                    rain_values.append(edge_data.get('rain_weight', 0))
                    heat_values.append(edge_data.get('heat_weight', 0))
                    wind_values.append(edge_data.get('wind_weight', 0))
                    humidity_values.append(edge_data.get('humidity_weight', 0))
                    wind_dir_values.append(edge_data.get('wind_dir_weight', 0))
                    
                    if is_fastest:
                        weight_values.append(edge_data.get('travel_time', 0))
                    else:
                        weight_values.append(edge_data.get(f'{weight_type}_weight', 0))
            
            # Normalize weight values for coloring
            if weight_values and max(weight_values) > 0:
                w_min, w_max = min(weight_values), max(weight_values)
                w_norm = [(w - w_min) / (w_max - w_min) for w in weight_values]
            else:
                w_norm = [0] * len(weight_values)
            
            
            cmap = weight_colormaps.get(weight_type, weight_colormaps['rain'])
            
            # Draw each edge segment
            for i, (u, v) in enumerate(zip(route[:-1], route[1:])):
                rgba = cmap(w_norm[i])
                color_hex = mcolors.rgb2hex(rgba[:3])
                
                segment_coords = [
                    (G.nodes[u]['y'], G.nodes[u]['x']),
                    (G.nodes[v]['y'], G.nodes[v]['x'])
                ]
                
                # Get edge data for popup
                edge_data = G.get_edge_data(u, v)
                if isinstance(edge_data, dict):
                    k0 = list(edge_data.keys())[0]
                    edge_info = edge_data[k0]
                else:
                    edge_info = edge_data
                
                # Create popup
                if is_fastest:
                    route_label = "Fastest Route"
                else:
                    alt_label = f" (Alternative {route_index + 1})" if route_index > 0 else ""
                    route_label = f"{weight_type.capitalize()}-Optimized Route{alt_label}"
                
                popup_html = f"""
                <div style='min-width: 250px;'>
                    <h4 style='margin: 0 0 10px 0; color: {color_hex};'>{route_label} - Segment {i+1}</h4>
                    <table style='width: 100%; border-collapse: collapse;'>
                        <tr style='background-color: #e3f2fd; border-bottom: 1px solid #ddd;'>
                            <td colspan='2'><b>Weather Weights</b></td>
                        </tr>
                        <tr style='border-bottom: 1px solid #ddd; {"background-color: #fff3cd;" if weight_type == "rain" else ""}'>
                            <td><b>Rain Weight:</b></td>
                            <td>{rain_values[i]:.4f}</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #ddd; {"background-color: #fff3cd;" if weight_type == "heat" else ""}'>
                            <td><b>Heat Weight:</b></td>
                            <td>{heat_values[i]:.4f}</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #ddd; {"background-color: #fff3cd;" if weight_type == "wind" else ""}'>
                            <td><b>Wind Weight:</b></td>
                            <td>{wind_values[i]:.4f}</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #ddd; {"background-color: #fff3cd;" if weight_type == "wind_dir" else ""}'>
                            <td><b>Wind Direction Weight:</b></td>
                            <td>{wind_dir_values[i]:.4f}</td>
                        </tr>
                        <tr style='border-bottom: 1px solid #ddd; {"background-color: #fff3cd;" if weight_type == "humidity" else ""}'>
                            <td><b>Humidity Weight:</b></td>
                            <td>{humidity_values[i]:.4f}</td>
                        </tr>
                        <tr style='background-color: #f5f5f5; border-bottom: 1px solid #ddd;'>
                            <td colspan='2'><b>Edge Properties</b></td>
                        </tr>
                        <tr style='border-bottom: 1px solid #ddd;'>
                            <td><b>Length:</b></td>
                            <td>{edge_info.get('length', 0):.2f} m</td>
                        </tr>
                        <tr style='{"background-color: #fff3cd;" if is_fastest else ""}'>
                            <td><b>Travel Time:</b></td>
                            <td>{edge_info.get('travel_time', 0):.2f} s</td>
                        </tr>
                    </table>
                </div>
                """
                
                popup_widget = widgets.HTML(popup_html)
                popup = Popup(
                    location=segment_coords[0],
                    child=popup_widget,
                    close_button=True,
                    auto_close=True,
                    close_on_escape_key=True
                )
                
                # Make fastest route thinner and slightly transparent
                weight_val = 4 if is_fastest else 7
                opacity_val = 0.3 if is_fastest else 0.7
                
                route_segment = Polyline(
                    locations=segment_coords,
                    color=color_hex,
                    weight=weight_val,
                    opacity=opacity_val,
                    fill=False,
                )
                route_segment.popup = popup
                m.add_layer(route_segment)
                
                
                
    except Exception as e:
        print(f"Route error: {e}")
        import traceback
        traceback.print_exc()