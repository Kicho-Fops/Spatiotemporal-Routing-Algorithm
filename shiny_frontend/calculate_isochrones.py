
import networkx as nx




def calculate_isochrones(G, orig, route):
    """
    This function calculates isochrones for a given graph G and origin node.
    It assigns a 'zone' attribute to each edge in the graph based on travel time segments
    
    Later this different zones will be used to stitch different weather datasets times together.
    """
    for u, v, k, data in G.edges(data=True, keys=True):
        
        # Add a tag for zone
        data['zone'] = 0
        
        
        # Some nodes have max speed in MPH, some have in KMH, this converts everything to kmh
        # meters_per_minute = travel_speed * 1000 / 60 #km per hour to m per minute
        if 'maxspeed' in data:
            # Speed is saved as "00 mph", we'll just take the first part and convert to kph
            # Also data is saved as a list sometimes, so we handle that too
            if isinstance(data['maxspeed'], list):
                data['maxspeed'] = data['maxspeed'][0]
            # print(data['maxspeed'])   
            if isinstance(data['maxspeed'], (int, float)):
                data['speed_kph'] = float(data['maxspeed']) * 1.60934
            else:
                text = data['maxspeed']
                # Convert to string and split by spaces, take first part
                first_part = str(text).split()[0]
                if first_part.isdigit():
                    speed_value = first_part
                else: 
                    speed_value = text[:-4].strip()
                data['speed_kph'] = float(speed_value) * 1.60934


        data['time'] = data['length'] / (data['speed_kph'] * 1000 / 3600)

    travel_times = get_estimated_ETA(G, route)
    trip_times_seconds = [t * 60 for t in travel_times]
    for zone_num, trip_time in enumerate(sorted(trip_times_seconds), start=1):
        subgraph = nx.ego_graph(G, orig, radius=trip_time, distance='time')
        for u, v, k in subgraph.edges(keys=True):
            if G.has_edge(u, v, k) and G[u][v][k]["zone"] == 0:
                G[u][v][k]["zone"] = zone_num
                
    return trip_times_seconds


def get_estimated_ETA(G, route):
    """
    Obtains estimated ETA from a calculated route.
    Parameters:
    route (list): List of node IDs representing the route.
    
    Returns:
    List: A list of 15 minute segments until the total travel time in seconds.

    Example:
    [15, 30, 45, 60] for a 1 hour trip.
    
    """
    # Get travel time in seconds
    total_time_sec = sum(
        G[u][v][0]['time']
        for u, v in zip(route[:-1], route[1:])
    )
    
    #Create 15 minute segments
    trip_times = list(range(15, int(total_time_sec // 60) + 15, 15))
    
    
    return trip_times