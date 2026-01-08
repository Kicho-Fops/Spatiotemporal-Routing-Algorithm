from shiny import render
from shiny.express import input, ui
import osmnx as ox
import networkx as nx
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from shiny import reactive
from dotenv import load_dotenv
import os
from ipyleaflet import Map, CircleMarker
from shinywidgets import render_widget  
from io import BytesIO
import base64
from ipyleaflet import ImageOverlay


from load_static import DataLoader
from calculate_isochrones import calculate_isochrones
from weight_calculation import classic_weight_calculations, GNN_weight_calculations
from map_widget import calculate_and_display_route


# Global parameters
load_dotenv()

_data_loader = None

def get_data_loader(time=16):
    """
    Get or create the singleton DataLoader instance.
    """
    global _data_loader
    if _data_loader is None:
        _data_loader = DataLoader(time=time)

    return _data_loader

# Base directory from which to load weather data
BASE_DATA_DIR = os.getenv("BASE_DATA_DIR")
if BASE_DATA_DIR is None:
    BASE_DATA_DIR = '{PATH\\TO\\YOUR\\DATA}\\try_clean\\good_candidates\\20250706\\t00z\\outputs\\'

# Construct data carrying object
data_loader = get_data_loader(time=16)

# Define paths to weather data files

data_loader.load_graph(graph_path=r"chicago.graphml")

G = data_loader.G
rain_data = data_loader.rain_data



TOTAL_WEIGHTS = 0.0
# --- UI ---
ui.page_opts(title="Route viewer", fillable=True)


with ui.layout_sidebar():
    # Sidebar - Controls
    with ui.sidebar():
        # Default origin and destination coordinates, starting at the Hilton near O'hare to 
        ui.input_text("origin", "Enter Origin (lat, lon)", "41.9814866, -87.8593659")
        ui.input_text("destination", "Enter Destination (lat, lon)", "41.7905674, -87.5831307")
        
        
        
        
        # Default options for route visualization
        ui.input_radio_buttons(
            "graph_show",
            "Route Visualization:",
            {"single": "Single map with single route",
             "single_m": "A single map with multiple routes",
             "multi": "Show optimization for a single weight with alternatives"},
            selected="single",
        ) 
        
        @render.ui
        def weight_type_selector():
            if input.graph_show() == "multi":
                return ui.input_radio_buttons(
                    "weight_type",
                    "Weight to Optimize:",
                    {
                        "rain": "Rain-aware",
                        "heat": "Heat-aware",
                        "wind": "Wind-aware",
                        "humidity": "Humidity-aware",
                    },
                    selected="rain"
                )
            else:
                return ui.input_checkbox_group(
                    "weight_type",
                    "Weights to Use:",
                    {
                        "rain": "Rain-aware",
                        "heat": "Heat-aware",
                        "wind": "Wind-aware",
                        "humidity": "Humidity-aware",
                    },
                )
        
        ui.input_radio_buttons(  
        "weight_calculation_method",  
            "Weight Calculation Method:",  
            {"GNN": "GNN", "Classic": "Classic"},  
        )  
        
        

        # Default weight sliders
        @render.ui
        def weight_adjustments():
            selected_weights = input.weight_type()
            
            if selected_weights:  
                sliders = []
                
                if "rain" in selected_weights:
                    sliders.append(
                        ui.input_slider(
                            "rain_weight", 
                            "Rain Weight:", 
                            min=0.0, max=1.0, value=0.858, step=0.001
                        )
                    )

                if "heat" in selected_weights:
                    sliders.append(
                        ui.input_slider(
                            "heat_weight", 
                            "Heat Weight:", 
                            min=0.0, max=1.0, value=0.0285, step=0.001
                        )
                    )

                if "wind" in selected_weights:
                    sliders.append(
                        ui.input_slider(
                            "wind_weight", 
                            "Wind Weight:", 
                            min=0.0, max=1.0, value=0.0965, step=0.001
                        )
                    )
                

                if "humidity" in selected_weights:
                    sliders.append(
                        ui.input_slider(
                            "humidity_weight", 
                            "Humidity Weight:", 
                            min=0.0, max=1.0, value=0.016, step=0.001
                        )
                    )
                
                if sliders:
                    return ui.div(
                        ui.h4("Weight Adjustments", style="margin-top: 20px;"),
                        ui.div(
                            *sliders,
                            style="border: 1px solid #ddd; padding: 15px; border-radius: 5px; background-color: #f9f9f9;"
                        )
                    )
            
            return ui.div() 
        @render.text
        def weight_sum_display():
            # The sum of the selected weights cannot exceed 1.0, so we calculate the sum and check its validity
            
            selected_weights = input.weight_type()
            
            if len(selected_weights) < 2:
                return ""
            
            total = 0
            if "rain" in selected_weights:
                total += input.rain_weight()
            if "heat" in selected_weights:
                total += input.heat_weight()
            if "wind" in selected_weights:
                total += input.wind_weight()
            if "humidity" in selected_weights:
                total += input.humidity_weight()
            
            TOTAL_WEIGHTS = total

            if total > 1.0:
                status = "Sum exceeds 1, please set the sum of weights to 1.0"
            else:
                status = "Sum is valid."
            
            
            return f"Sum of weights: {total:.3f} / 1.000 - {status}"
        
        @reactive.effect
        @reactive.event(input.normalize_weights)
        def _():
            
            # This function normalizes the weights so that their sum equals 1.0
            selected_weights = input.weight_type()
            
            if len(selected_weights) < 2:
                return
            
            weights = {}
            if "rain" in selected_weights:
                weights['rain'] = input.rain_weight()
            if "heat" in selected_weights:
                weights['heat'] = input.heat_weight()
            if "wind" in selected_weights:
                weights['wind'] = input.wind_weight()
            if "humidity" in selected_weights:
                weights['humidity'] = input.humidity_weight()
            
            total = sum(weights.values())
            
            if total == 0:
                # Equal distribution if all are zero
                normalized_value = 1.0 / len(weights)
                for key in weights:
                    weights[key] = normalized_value
            else:
                # Normalize proportionally
                for key in weights:
                    weights[key] = weights[key] / total
            
            # Update sliders
            if "rain" in weights:
                ui.update_slider("rain_weight", value=weights['rain'])
            if "heat" in weights:
                ui.update_slider("heat_weight", value=weights['heat'])
            if "wind" in weights:
                ui.update_slider("wind_weight", value=weights['wind'])
            if "humidity" in weights:
                ui.update_slider("humidity_weight", value=weights['humidity'])

        ui.input_action_button("normalize_weights", "Set to a sum of 1", style="margin-top: 10px;")

    # Main panel - Map and route metrics

    fastest_metrics = reactive.value({
        'distance': 0, 'duration': 0, 'rain': 0, 
        'heat': 0, 'wind': 0, 'humidity': 0
    })
    
    weather_metrics = reactive.value({
        'distance': 0, 'duration': 0, 'rain': 0, 
        'heat': 0, 'wind': 0, 'humidity': 0
    })

    @render.text
    def fastest_route_text():
        m = fastest_metrics()
        return "The fastest route has a distance of {:.2f} km and an estimated duration of {:.2f} minutes.\n\n" \
               "Rain Exposure: {:.4f}, Heat Exposure: {:.4f}, Wind Exposure: {:.4f}, Humidity Exposure: {:.4f}".format(
                   m['distance'], m['duration'], m['rain'], m['heat'], m['wind'], m['humidity']
               )
    
    @render.text
    def weather_aware_route_text():
        m = weather_metrics()
        return "The rain route has a distance of {:.2f} km and an estimated duration of {:.2f} minutes.\n\n" \
               "Rain Exposure: {:.4f}, Heat Exposure: {:.4f}, Wind Exposure: {:.4f}, Humidity Exposure: {:.4f}".format(
                   m['distance'], m['duration'], m['rain'], m['heat'], m['wind'], m['humidity']
               )

    if TOTAL_WEIGHTS <= 1.0:
        ui.input_action_button(id="generate_plot", label="Generate Plot", disabled=False)
    else:
        ui.input_action_button(id="generate_plot", label="Generate Plot", disabled=True)

 
    # There is a wired bug where the map dosent unload propperly on re-generation
    # this way we force it to unload and reload
 
    map_instance = reactive.value(None)
    is_loading = reactive.value(False)
    map_loaded = reactive.value(False)
    
    @reactive.effect
    @reactive.event(input.generate_plot)
    def create_new_map():
        """Destroy old map and trigger creation of new one"""
        
        is_loading.set(True)
        map_loaded.set(False)
        map_instance.set(None)
        map_instance.set("recreate")


    # The spinner overlay intented to show in the time between clicking "Generate map" dosent work as intended
    # currently disabled

    # @render.ui
    # @reactive.event(input.generate_plot)
    # def loading_spinner():
        
    #     """Display loading spinner overlay while map is loading"""
    #     if not map_loaded():
    #         if input.generate_plot() == 0:
    #             return ui.div(
    #                 ui.HTML("<div style='padding: 20px; text-align: center;'>Click 'Generate Plot' to load map</div>")
    #             )
    #         else:
    #             return ui.div(
    #                 ui.HTML("""
    #                     <div style="
    #                         position: absolute;
    #                         top: 50%;
    #                         left: 50%;
    #                         transform: translate(-50%, -50%);
    #                         z-index: 9999;
    #                         background-color: rgba(255, 255, 255, 0.7);
    #                         border-radius: 12px;
    #                         padding: 40px;
    #                         display: flex;
    #                         flex-direction: column;
    #                         align-items: center;
    #                         justify-content: center;">
    #                         <img src='https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif' 
    #                             alt='Loading...' 
    #                             style='width: 64px; height: 64px;'/>
    #                         <p style='margin-top: 20px; font-size: 16px; color: #555;'>Generating route map...</p>
    #                     </div>
    #                 """),
    #                 style="position: relative; height: 100%; width: 100%;"
    #             )
    #     return ui.div()



    @render_widget
    @reactive.event(input.generate_plot)
    def map_widget():
        
        _ = map_instance()


        weight_types = input.weight_type()

        rain_w = input.rain_weight() if "rain" in weight_types else None
        heat_w = input.heat_weight() if "heat" in weight_types else None
        wind_w = input.wind_weight() if "wind" in weight_types else None
        humidity_w = input.humidity_weight() if "humidity" in weight_types else None
    
        
        try:
            orig_lat, orig_lon = map(float, input.origin().split(","))
            dest_lat, dest_lon = map(float, input.destination().split(","))

            orig_node = ox.distance.nearest_nodes(G, X=orig_lon, Y=orig_lat)
            dest_node = ox.distance.nearest_nodes(G, X=dest_lon, Y=dest_lat)

            rain_data, lats, lons, rain_ds = data_loader.load_rain_data(
                rain_data_path= BASE_DATA_DIR + "RAIN.nc"
            )
                
            heat_data, lats, lons, heat_ds = data_loader.load_heat_index_data(
                heat_index_path= BASE_DATA_DIR + "T2.nc"
            )
            wind_speed_data, wind_dir_data, lats, lons, wind_speed_ds, wind_dir_ds = data_loader.load_wind_data(
                wind_speed_path= BASE_DATA_DIR + "WSPD10.nc",
                wind_direction_path= BASE_DATA_DIR + "WDIR10.nc"
            )
            humidity_data, lats, lons, humidity_ds = data_loader.load_relative_humidity_data(
                rh_data_path= BASE_DATA_DIR + "RH2.nc"
            )

            route = nx.shortest_path(G, orig_node, dest_node, weight="travel_time")
            trip_times_seconds = calculate_isochrones(G, orig_node, route)

            if input.weight_calculation_method() == "Classic":
                classic_weight_calculations(
                    G, lats, lons,
                    rain_ds=rain_ds if "rain" in weight_types else None,
                    heat_ds=heat_ds if "heat" in weight_types else None,
                    wind_speed_ds=wind_speed_ds if "wind" in weight_types else None,
                    wind_dir_ds=wind_dir_ds if "wind" in weight_types else None,
                    humidity_ds=humidity_ds if "humidity" in weight_types else None,
                    time=data_loader.time,
                    rain_weight=input.rain_weight() if "rain" in input.weight_type() else None,
                    heat_weight=input.heat_weight() if "heat" in input.weight_type() else None,
                    wind_weight=input.wind_weight() if "wind" in input.weight_type() else None,
                    humidity_weight=input.humidity_weight() if "humidity" in input.weight_type() else None,
                )
            else:
                optional_weights = {}
                if rain_w is not None:
                    optional_weights['rain_weight'] = rain_w
                if heat_w is not None:
                    optional_weights['heat_weight'] = heat_w
                if wind_w is not None:
                    optional_weights['wind_weight'] = wind_w
                if humidity_w is not None:
                    optional_weights['humidity_weight'] = humidity_w


                GNN_weight_calculations(G, lats, lons,
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
                    time=data_loader.time,
                    trip_time_seconds=trip_times_seconds,
                    **optional_weights # **kwargs
                )
            
            m = Map(center=(41.869782371584364, -87.64851844339898), zoom=11)
              
            # Add rain overlay representing ONLY starting time, NOT the stitched dataset 
            # currently disabled due to possibility of confusing the user
                 
            # if rain_data is not None:
            #     # Create a normalized rain overlay image
            #     fig_overlay, ax_overlay = plt.subplots(figsize=(10, 10))
            #     ax_overlay.axis('off')
                
            #     # Plot rain data with transparency
            #     norm = mcolors.Normalize(vmin=np.nanmin(rain_data), vmax=10)  # an arbitrary number to better showcase rain intensity 
            #     cmap = plt.cm.Blues
            #     cmap._init()
            #     cmap._lut[:, -1] = 0.4 # Alpha channel
                
            #     img = ax_overlay.imshow(rain_data, cmap=cmap, norm=norm, 
            #                            extent=[lons.min(), lons.max(), lats.min(), lats.max()],
            #                            origin='lower', interpolation='bilinear')
                
            #     # Save to bytes
            #     buf = BytesIO()
            #     fig_overlay.savefig(buf, format='png', bbox_inches='tight', 
            #                        pad_inches=0, transparent=True, dpi=150)
            #     plt.close(fig_overlay)
            #     buf.seek(0)
                
            #     # Encode to base64
            #     img_b64 = base64.b64encode(buf.read()).decode()
            #     img_url = f"data:image/png;base64,{img_b64}"
                
            #     # Add as ImageOverlay
            #     rain_overlay = ImageOverlay(
            #         url=img_url,
            #         bounds=[[lats.min(), lons.min()], [lats.max(), lons.max()]],
            #         opacity=0.9
            #     )
            #     m.add_layer(rain_overlay)

            origin_marker = CircleMarker(
                location=(orig_lat, orig_lon),
                radius=8,
                color='green',
                fill_color='green',
                fill_opacity=0.8,
                title="Origin"
            )
            dest_marker = CircleMarker(
                location=(dest_lat, dest_lon),
                radius=8,
                color='red',
                fill_color='red',
                fill_opacity=0.8,
                title="Destination"
            )
            m.add_layer(origin_marker)
            m.add_layer(dest_marker)
            
            
            if input.graph_show() == "single":
                try:
                    # Route calculation with Yen's algorithm is handled in this function
                    calculate_and_display_route(G, orig_node, dest_node, m, weather_metrics, fastest_metrics, ["total"]) # "_weight" is added in this function, totaling "total_weight"    
                except Exception as e:
                    print(f"Route error: {e}")
            elif input.graph_show() == "single_m":
                try:
                    calculate_and_display_route(G, orig_node, dest_node, m, weather_metrics, fastest_metrics, list(input.weight_type()))
                    
                except Exception as e:
                    print(f"Route error: {e}")
                    import traceback
                    traceback.print_exc()
            else: 
                try:
                    calculate_and_display_route(G, orig_node, dest_node, m, weather_metrics, fastest_metrics, [input.weight_type()], k_routes=3)
                    
                except Exception as e:
                    print(f"Route error: {e}")
                    import traceback
                    traceback.print_exc()
            is_loading.set(False)
            m
            return m

            
        except Exception as e:
            is_loading.set(False)
            print(f"Map widget error: {e}")
            from ipywidgets import HTML
            return HTML(f"<div style='padding: 20px; color: red;'>Error: {e}</div>")
