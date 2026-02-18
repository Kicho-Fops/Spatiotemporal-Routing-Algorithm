from flask import Flask
import json
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import networkx as nx
from networkx.readwrite import json_graph
import pandas as pd

from service.routing_service import calculate_route, get_graph as get_graph_from_service


"""

Controller layer

"""

app = Flask(__name__)

CORS(app)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"



@app.route('/route', methods=["POST"])
def calculate_weather_aware_route():
    data = request.get_json()
    datafile = data["city"]
    origin = data["origin"]
    destination = data["destination"]
    map_view_mode = data["map_view_mode"]
    K_variable_paths = data["paths"]
    route_conditions = data["weather"]
    route_weights = data["weights"]
    time = data["time"]
    Graph_name = data["Graph_name"]
    output_format = data["output_format"] if "output_format" in data else "json"
    
    
    # TODO: Handle that the data is valid
    
    
    
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
    
    # 1st step. Obtain DataLoader status, check if the map exists and if its loaded into memory
    
    
    
    route_coords = calculate_route(datafile, 
                            origin, 
                            destination,
                            map_view_mode, 
                            K_variable_paths,
                            route_conditions,
                            route_weights,
                            time,
                            Graph_name,
                            output_format=output_format)

    if output_format == "json":
        return jsonify({"route_coords": route_coords}), 200
    elif output_format == "geojson":
        response = make_response(jsonify(route_coords), 200)

        # 3. Set the correct MIME type for GeoJSON
        response.headers["Content-Type"] = "application/geo+json"

        return response

    


@app.route('/graph/<graph_name>', methods=["GET"])
def get_graph(graph_name):
    """
    Obtain the graph from memory given its name.
    If its not loaded, this will load it into memory.
+    :param graph_name: Description
    """
    

    time = request.args.get("time", default=18)
    
    graph = get_graph_from_service(graph_name, graph_name, time)

    # Service already returns a JSON-serializable dict
    return jsonify({"graph": graph}), 200