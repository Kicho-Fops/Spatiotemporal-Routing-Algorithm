import osmnx as ox
import netCDF4 as nc
import numpy as np
import os



class DataLoader:
    """
    A class to load and manage static data such as graphs and weather data for Chicago area.
    """
    def __init__(self, time=18):
        self.G = None
        self.rain_data = {}
        self.wind_speed_data = {}
        self.wind_direction_data = {}
        self.heat_index_data = {}
        self.relative_humidity_data = {}
        self.lat_min, self.lat_max = 41.61, 42.04
        self.lon_min, self.lon_max = -88.03, -87.30
        self.time = time

    def load_graph(self, graph_path=None):
        """
        Loads the graph from a GraphML file and adds edge speeds and travel times.
        Graph should be pre-downloaded and saved as a .graphml file.
        
        Parameters:
        graph_path (str): Path to the GraphML file.
        """
        
        if self.G is not None:
            return
        
        if graph_path is not None:
            self.graph_path = graph_path
        self.G = ox.load_graphml(self.graph_path)
        self.G = ox.routing.add_edge_speeds(self.G)
        self.G = ox.routing.add_edge_travel_times(self.G)
        
        
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
    