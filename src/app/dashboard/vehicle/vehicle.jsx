import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

function Vehicle() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    plate_number: "",
    route: "",
    status: "AVAILABLE",
    active_driver: null,
  });

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE}/drivers/`);
      if (!response.ok) throw new Error("Failed to fetch drivers");
      const data = await response.json();
      setDrivers(data);
    } catch (err) {
      console.error("Error fetching drivers:", err.message);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${API_BASE}/vehicles/`);
      if (!response.ok) throw new Error("Failed to fetch vehicles");
      const data = await response.json();
      setVehicles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing
        ? `${API_BASE}/vehicles/${editing.id}/`
        : `${API_BASE}/vehicles/`;
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Failed to save vehicle");
      fetchVehicles();
      setForm({
        plate_number: "",
        route: "",
        status: "AVAILABLE",
        active_driver: null,
      });
      setEditing(null);
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (vehicle) => {
    setEditing(vehicle);
    setForm({ ...vehicle });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      const response = await fetch(`${API_BASE}/vehicles/${id}/`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete vehicle");
      fetchVehicles();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Vehicles</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          placeholder="Plate Number"
          value={form.plate_number}
          onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
          required
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Route"
          value={form.route}
          onChange={(e) => setForm({ ...form, route: e.target.value })}
          required
          className="border p-2 mr-2"
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="border p-2 mr-2"
        >
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
        <select
          value={form.active_driver || ""}
          onChange={(e) =>
            setForm({
              ...form,
              active_driver: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          className="border p-2 mr-2"
        >
          <option value="">Select Driver (Optional)</option>
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.name}
            </option>
          ))}
        </select>
        <button type="submit" className="bg-blue-500 text-white p-2">
          {editing ? "Update" : "Add"} Vehicle
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm({
                plate_number: "",
                route: "",
                status: "AVAILABLE",
                active_driver: null,
              });
            }}
            className="bg-gray-500 text-white p-2 ml-2"
          >
            Cancel
          </button>
        )}
      </form>
      <table className="w-full border">
        <thead>
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Plate Number</th>
            <th className="border p-2">Route</th>
            <th className="border p-2">Active Driver</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <td className="border p-2">{vehicle.code}</td>
              <td className="border p-2">{vehicle.plate_number}</td>
              <td className="border p-2">{vehicle.route}</td>
              <td className="border p-2">
                {vehicle.active_driver_name || "-"}
              </td>
              <td className="border p-2">{vehicle.status}</td>
              <td className="border p-2">
                <button
                  onClick={() => handleEdit(vehicle)}
                  className="bg-yellow-500 text-white p-1 mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(vehicle.id)}
                  className="bg-red-500 text-white p-1"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl mb-4">Edit Vehicle</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Plate Number"
                value={form.plate_number}
                onChange={(e) =>
                  setForm({ ...form, plate_number: e.target.value })
                }
                required
                className="border p-2 mr-2 w-full mb-2"
              />
              <input
                type="text"
                placeholder="Route"
                value={form.route}
                onChange={(e) => setForm({ ...form, route: e.target.value })}
                required
                className="border p-2 mr-2 w-full mb-2"
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="border p-2 mr-2 w-full mb-2"
              >
                <option value="AVAILABLE">Available</option>
                <option value="ON_TRIP">On Trip</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
              <select
                value={form.active_driver || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    active_driver: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                className="border p-2 mr-2 w-full mb-2"
              >
                <option value="">Select Driver (Optional)</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-blue-500 text-white p-2 w-full"
              >
                Update Vehicle
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditing(null);
                  setForm({
                    plate_number: "",
                    route: "",
                    status: "AVAILABLE",
                    active_driver: null,
                  });
                }}
                className="bg-gray-500 text-white p-2 w-full mt-2"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vehicle;
