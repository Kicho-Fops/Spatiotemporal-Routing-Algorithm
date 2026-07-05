import osmnx as ox
import netCDF4 as nc
import numpy as np
import os
import networkx as nx


class DataLoader:
    """
    A class to load and manage static data such as graphs and weather data.
    """
    def __init__(self, time=18):
        self.G = None
        self.lat_min, self.lat_max = 41.61, 42.04 # Chicago area lat/lon bounds
        self.lon_min, self.lon_max = -88.03, -87.30 # Chicago area lat/lon bounds
        self.time = time
        self.isGraphLoaded = False
        self.cityName = None # The program may have multiple cities loaded into memory at once
        self.graph_path = None
        
    def load_graph(self, graph_path=None, city_name= None):
        """
        Loads the graph from a GraphML file and adds edge speeds and travel times.
        Graph should be pre-downloaded and saved as a .graphml file.
        
        Parameters:
        graph_path (str): Path to the GraphML file.
        """
        if self.isGraphLoaded:
            print("Graph already loaded, skipping")
            return self.G
        
        if not self.isGraphLoaded:
            print("Graph not loaded, loading now")
            
            self.graph_path = f"data/{graph_path}.graphml"
            graph = ox.load_graphml(self.graph_path)
            self.G = nx.MultiDiGraph(graph)
            
            
            # add_edge_speed may have a bug:
            # When adding the speed in kph this line is executed:
            # edges["speed_kph"] = edges["maxspeed"].astype(str).map(_clean_maxspeed).astype(float)
            # This line is executed on this edges["maxspeed"] set (first copule examples from chicago.graphml)
            #  u            v            key
            # 702090       261263104    0         NaN
            # 1223297118                0      55 mph 
            # Where NaN could be converted into a literal string "nan" instead of an absence of a number.
            
            # To correct go into \venv\Lib\site-packages\osmnx\routing.py", line 272, in add_edge_speeds 
            # And replace that line with this:            
            # edges["speed_kph"] = edges["maxspeed"].fillna("none").astype(str).map(_clean_maxspeed).astype(float)
            self.G = ox.routing.add_edge_speeds(self.G)
            self.G = ox.routing.add_edge_travel_times(self.G)    
            
            # Any modifications to the graph in terms of bounding should be done here
    
            
            self.isGraphLoaded = True
            self.cityName = city_name
            print(f"Graph loaded with bounds")
        return self.G
        
        
    def load_NetCDF_data(self, data_path, variable_name):
        """
        Loads data from a NetCDF file and masks it to the specified lat/lon bounds for faster calculations.

        Parameters:
        data_path (str): Path to the NetCDF data file.
        variable_name (str): Name of the variable to extract from the NetCDF file.

        Returns:
        np.ndarray: Masked data array.

        """
        if not os.path.exists(data_path):
            raise FileNotFoundError(f"Data file not found: {data_path}")
        ds = nc.Dataset(data_path)
        data = ds.variables[variable_name][self.time, :, :]  # timestep
        lats = ds.variables['XLAT'][self.time, :, :]
        lons = ds.variables['XLONG'][self.time, :, :]

        mask = (lats >= self.lat_min) & (lats <= self.lat_max) & (lons >= self.lon_min) & (lons <= self.lon_max)
        data_masked = np.where(mask, data, np.nan)

        self.rain_data = [data_masked, lats, lons]
        return data_masked, lats, lons, ds
    
    # A couple of specific data loaders for different weather parameters
    
    def load_rain_data(self, rain_data_path):
        """
        Implementation of load_rain_data method.
        Loads rain data from a NetCDF file and masks it to the specified lat/lon bounds for faster calculations.
        
        Parameters:
        rain_data_path (str): Path to the NetCDF rain data file.
        
        Returns:
        np.ndarray: Masked rain data array.
        
        """

        return self.load_NetCDF_data(rain_data_path, 'RAIN')
    
    def load_heat_index_data(self, heat_index_path):
        """
        Implementation of load_rain_data method.
        Loads heat index data from a NetCDF file and masks it to the specified lat/lon bounds for faster calculations.
        
        Parameters:
        heat_index_path (str): Path to the NetCDF heat index data file.
        
        Returns:
        np.ndarray: Masked heat index data array.
        
        """
        return self.load_NetCDF_data(heat_index_path, 'T2')


    def load_wind_data(self, wind_speed_path, wind_direction_path):
        """
        
        Loads wind speed and direction data from NetCDF files and masks them to the specified lat/lon bounds for faster calculations.
        
        Parameters:
        wind_speed_path (str): Path to the NetCDF wind speed data file.
        wind_direction_path (str): Path to the NetCDF wind direction data file.
        
        Returns:
        tuple: Masked wind speed and direction arrays.
        
        """

        ds_wspd = self.load_NetCDF_data(wind_speed_path, 'WSPD10')
        ds_wdir = self.load_NetCDF_data(wind_direction_path, 'WDIR10')

        wspd = ds_wspd[0]
        wdir = ds_wdir[0]

        lats_w = ds_wspd[1]
        lons_w = ds_wspd[2]

        mask_wind = (lats_w >= self.lat_min) & (lats_w <= self.lat_max) & (lons_w >= self.lon_min) & (lons_w <= self.lon_max)
        wspd_masked = np.where(mask_wind, wspd, np.nan)
        wdir_masked = np.where(mask_wind, wdir, np.nan)

        self.wind_speed_data = [wspd_masked, lats_w, lons_w]
        self.wind_direction_data = [wdir_masked, lats_w, lons_w]

        return wspd_masked, wdir_masked, lats_w, lons_w, nc.Dataset(wind_speed_path), nc.Dataset(wind_direction_path)

    def load_relative_humidity_data(self, rh_data_path):
        """
        Implementation of load_rain_data method.
        Loads relative humidity data from a NetCDF file and masks it to the specified lat/lon bounds for faster calculations.
        
        Parameters:
        rh_data_path (str): Path to the NetCDF relative humidity data file.
        
        Returns:
        np.ndarray: Masked relative humidity data array.
        
        """
        return self.load_NetCDF_data(rh_data_path, 'RH2')
    
    def load_temperature_data(self, temp_data_path):
        """
        Implementation of load_rain_data method.
        Loads temperature data from a NetCDF file and masks it to the specified lat/lon bounds for faster calculations.
        
        Parameters:
        temp_data_path (str): Path to the NetCDF temperature data file.
        
        Returns:
        np.ndarray: Masked temperature data array.
        
        """
        return self.load_NetCDF_data(temp_data_path, 'T2')
    
    
class DataManager:
    """
    A class to manage multiple graphs.
    """
    
    _instance = None
    _graphs = {}
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(DataManager, cls).__new__(cls)
        return cls._instance

    def __init__(self, time=18) -> None:
        if not hasattr(self, 'time'):
            self.time = time
        
    def load_graph(self, graph_name, graph_path) -> DataLoader:
        """Loads a graph into memory if it doesn't already exist."""
        if graph_name not in self._graphs:
            print("Load new graph into memory")
            loader = DataLoader(time=self.time)
            loader.load_graph(graph_path=graph_path, city_name=graph_name)
            self._graphs[graph_name] = loader
        else:
            print("Graph already loaded, retrieving from memory")
        return self._graphs[graph_name]

    def get_graph(self, graph_name) -> nx.MultiDiGraph:
        """Retrieve a specific DataLoader instance."""
        if graph_name in self._graphs:
            return self._graphs[graph_name].G
    
    def get_graph_loader(self, graph_name) -> DataLoader:
        """Retrieve a specific DataLoader instance."""
        if graph_name in self._graphs:
            return self._graphs[graph_name]
    
    def unload_graph(self, graph_name) -> None:
        """Explicitly remove a graph from memory for Garbage Collection."""
        if graph_name in self._graphs:
            del self._graphs[graph_name]
            print("Graph deleted")    
        return 
