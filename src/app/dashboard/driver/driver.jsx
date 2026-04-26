import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

function Driver() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE}/drivers/`);
      if (!response.ok) throw new Error("Failed to fetch drivers");
      const data = await response.json();
      setDrivers(data);
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
        ? `${API_BASE}/drivers/${editing.id}/`
        : `${API_BASE}/drivers/`;
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Failed to save driver");
      fetchDrivers();
      setForm({ name: "", contact: "", status: "ACTIVE" });
      setEditing(null);
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (driver) => {
    setEditing(driver);
    setForm({ ...driver });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      const response = await fetch(`${API_BASE}/drivers/${id}/`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete driver");
      fetchDrivers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Drivers</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Contact"
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })}
          required
          className="border p-2 mr-2"
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="border p-2 mr-2"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white p-2">
          {editing ? "Update" : "Add"} Driver
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm({ id: "", name: "", contact: "", status: "ACTIVE" });
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
            <th className="border p-2">Name</th>
            <th className="border p-2">Contact</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((driver) => (
            <tr key={driver.id}>
              <td className="border p-2">{driver.code}</td>
              <td className="border p-2">{driver.name}</td>
              <td className="border p-2">{driver.contact}</td>
              <td className="border p-2">{driver.status}</td>
              <td className="border p-2">
                <button
                  onClick={() => handleEdit(driver)}
                  className="bg-yellow-500 text-white p-1 mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(driver.id)}
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
            <h2 className="text-xl mb-4">Edit Driver</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={form.code}
                disabled
                className="border p-2 w-full mb-2 bg-gray-100"
              />
              <input
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="border p-2 mr-2 w-full mb-2"
              />
              <input
                type="text"
                placeholder="Contact"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                required
                className="border p-2 mr-2 w-full mb-2"
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="border p-2 mr-2 w-full mb-2"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <button
                type="submit"
                className="bg-blue-500 text-white p-2 w-full"
              >
                Update Driver
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditing(null);
                  setForm({ id: "", name: "", contact: "", status: "ACTIVE" });
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

export default Driver;
