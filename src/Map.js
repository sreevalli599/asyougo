import React, { useState, useEffect, useCallback } from 'react';
import { LoadScript, GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';

// Your API Key
const API_KEY = 'AIzaSyD-t6oh57OWGbQe599z2kVPzm5KqyTWdro';

const Map = () => {
  const [directions, setDirections] = useState(null);
  const [error, setError] = useState(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [filter, setFilter] = useState('hospital'); // Default filter set to 'hospital'
  const [places, setPlaces] = useState([]); // For storing places along the route
  
  const mapRef = React.useRef(null);

  // Function to get directions from the Directions Service
  const getDirections = useCallback(async () => {
    if (window.google && window.google.maps) {
      const directionsService = new window.google.maps.DirectionsService();
      const request = {
        origin: start,
        destination: end,
        travelMode: window.google.maps.TravelMode.DRIVING,
      };

      try {
        const result = await directionsService.route(request);
        setDirections(result);
      } catch (error) {
        setError('Failed to get directions: ' + error);
        console.error(error);
      }
    }
  }, [start, end]);

  // Use useEffect to fetch places along the route once directions are available
  const getPlacesAlongRoute = useCallback(() => {
    if (!directions) return;

    const placesService = new window.google.maps.places.PlacesService(mapRef.current);

    const placeType = filter || 'hospital'; // Default filter if none is selected

    // Query for places along the route (within a 5km radius of the end point of the directions route)
    placesService.textSearch({
      query: placeType,
      location: directions.routes[0].legs[0].end_location, // Get places near the end location of the route
      radius: 5000, // 5km radius
    }, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setPlaces(results);  // Set the places if successfully fetched
      } else {
        setError('Failed to get places: ' + status);
        console.error("Failed to get places along the route:", status);
      }
    });
  }, [directions, filter]);

  // Fetch places when directions or filter changes
  useEffect(() => {
    if (directions) {
      getPlacesAlongRoute();
    }
  }, [directions, filter, getPlacesAlongRoute]);

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  // Handle input change for start and end locations
  const handleStartChange = (e) => setStart(e.target.value);
  const handleEndChange = (e) => setEnd(e.target.value);

  // Render Google Map with directions, markers, and places
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Input fields for Start and End locations */}
      <div style={{ padding: '10px', background: '#fff' }}>
        <input
          type="text"
          placeholder="Start Location (lat,lng)"
          value={start}
          onChange={handleStartChange}
        />
        <input
          type="text"
          placeholder="End Location (lat,lng)"
          value={end}
          onChange={handleEndChange}
        />
        <button onClick={getDirections}>Get Directions</button>
        
        {/* Filter Dropdown */}
        <select onChange={handleFilterChange} value={filter}>
          <option value="hospital">Hospitals</option>
          <option value="restaurant">Restaurants</option>
          <option value="supermarket">Supermarkets</option>
        </select>
      </div>

      <LoadScript googleMapsApiKey={API_KEY} libraries={['places']}>
        <GoogleMap
          mapContainerStyle={{ height: '60%', width: '100%' }}
          center={start ? { lat: 37.7749, lng: -122.4194 } : { lat: 0, lng: 0 }} // Adjust according to the input
          zoom={10}
          onLoad={(map) => { mapRef.current = map; }}
        >
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true, // Disable default markers
              }}
            />
          )}

          {/* Render markers for start, end, and places */}
          {start && <Marker position={{ lat: parseFloat(start.split(',')[0]), lng: parseFloat(start.split(',')[1]) }} />}
          {end && <Marker position={{ lat: parseFloat(end.split(',')[0]), lng: parseFloat(end.split(',')[1]) }} />}

          {/* Render additional markers for places along the route */}
          {places.map((place, index) => (
            <Marker
              key={index}
              position={place.geometry.location}
              title={place.name}
            />
          ))}
        </GoogleMap>
      </LoadScript>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      {/* Render places as a list */}
      <div style={{ padding: '10px', background: '#fff', maxHeight: '200px', overflowY: 'auto' }}>
        <h3>Places along the route:</h3>
        <ul>
          {places.length > 0 ? (
            places.map((place, index) => (
              <li key={index}>
                <strong>{place.name}</strong><br />
                {place.vicinity}
              </li>
            ))
          ) : (
            <li>No places found.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Map;
