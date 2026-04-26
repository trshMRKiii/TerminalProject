import React, { useEffect, useState } from "react";
import { apiService } from "../../../lib/api-service";

function Dispatch() {
  const [vehicles, setVehicles] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch vehicles and tickets on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [vehicleData, ticketData] = await Promise.all([
          apiService.getVehicles(),
          apiService.getTickets(),
        ]);
        setVehicles(vehicleData);
        setTickets(ticketData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute queue and active trips
  const queue = vehicles.filter(
    (v) =>
      v.status === "AVAILABLE" &&
      !v.is_archived &&
      tickets.some(
        (t) => t.vehicle?.id === v.id && t.status === "ISSUED"
      )
  );
  const activeTrips = vehicles.filter(
    (v) => v.status === "ON_TRIP" && !v.is_archived
  );

  // Find driver name for a vehicle
  const getDriverName = (vehicle) => {
    if (vehicle.active_driver_name) return vehicle.active_driver_name;
    // fallback: find latest ticket for this vehicle
    const ticket = tickets.find(
      (t) => t.vehicle && t.vehicle.id === vehicle.id && t.status === "DISPATCHED"
    );
    return ticket && ticket.driver ? ticket.driver.name : "-";
  };

  // Find route for a vehicle
  const getRoute = (vehicle) => vehicle.route || "-";

  // Dispatch handler: set vehicle to ON_TRIP and create ticket
  const handleDispatch = async (vehicle) => {
    try {
      await apiService.patch(`/vehicles/${vehicle.id}/`, { status: "ON_TRIP" });
      // Optionally, create a ticket here if needed
      // await apiService.createTicket({ vehicle_id: vehicle.id, driver_id: ... });
      // Refresh data
      const [vehicleData, ticketData] = await Promise.all([
        apiService.getVehicles(),
        apiService.getTickets(),
      ]);
      setVehicles(vehicleData);
      setTickets(ticketData);
    } catch (err) {
      setError(err.message);
    }
  };

  // Return handler: set vehicle to AVAILABLE
  const handleReturn = async (vehicle) => {
    try {
      // Reset vehicle status and clear active driver
      await apiService.patch(`/vehicles/${vehicle.id}/`, {
        status: "AVAILABLE",
        active_driver: null,   // 👈 free the driver
      });

      // Close the active ticket for this vehicle
      const activeTicket = tickets.find(
        (t) => t.vehicle?.id === vehicle.id && t.status === "ISSUED"
      );
      if (activeTicket) {
        await apiService.patch(`/tickets/${activeTicket.id}/`, {
          status: "COLLECTED",
        });
      }

      // Refresh data
      const [vehicleData, ticketData] = await Promise.all([
        apiService.getVehicles(),
        apiService.getTickets(),
      ]);
      setVehicles(vehicleData);
      setTickets(ticketData);
    } catch (err) {
      setError(err.message);
      console.error("Error handling return:", err);
    }
  };


  return (
    <div className="p-6">
      <header>
        <h1 className="text-3xl font-bold mb-6">Active Terminal Queue</h1>
      </header>
      {error && <div className="text-red-600 mb-4">Error: {error}</div>}
      <div className="flex flex-row gap-8">
        {/* Queue Table */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2">Queued Vehicles</h2>
          <table className="min-w-full border rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Plate Number</th>
                <th className="p-3 text-left">Driver</th>
                <th className="p-3 text-left">Route</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-3 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-3 text-center text-muted-foreground">No vehicles in queue</td>
                </tr>
              ) : (
                queue.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b">
                    <td className="p-3">{vehicle.plate_number}</td>
                    <td className="p-3">{getDriverName(vehicle)}</td>
                    <td className="p-3">{getRoute(vehicle)}</td>
                    <td className="p-3">{vehicle.status}</td>
                    <td className="p-3">
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        onClick={() => handleDispatch(vehicle)}
                      >
                        Dispatch
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Active Trips Table */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2">Active Trips (On Road)</h2>
          <table className="min-w-full border rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Plate Number</th>
                <th className="p-3 text-left">Driver</th>
                <th className="p-3 text-left">Route</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-3 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : activeTrips.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-3 text-center text-muted-foreground">No active trips</td>
                </tr>
              ) : (
                activeTrips.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b">
                    <td className="p-3">{vehicle.plate_number}</td>
                    <td className="p-3">{getDriverName(vehicle)}</td>
                    <td className="p-3">{getRoute(vehicle)}</td>
                    <td className="p-3">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        onClick={() => handleReturn(vehicle)}
                      >
                        Return
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dispatch;
