import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

function User() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    id: "",
    role: "PERSONNEL",
    department: "",
    is_active: true,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/users/`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
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
        ? `${API_BASE}/users/${editing.id}/`
        : `${API_BASE}/users/`;
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Failed to save user");
      fetchUsers();
      setForm({ id: "", role: "PERSONNEL", department: "", is_active: true });
      setEditing(null);
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (user) => {
    setEditing(user);
    setForm({ ...user });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      const response = await fetch(`${API_BASE}/users/${id}/`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete user");
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Users</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          placeholder="ID"
          value={form.id}
          onChange={(e) => setForm({ ...form, id: e.target.value })}
          required
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Department"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          required
          className="border p-2 mr-2"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="border p-2 mr-2"
        >
          <option value="PERSONNEL">Personnel</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="MANAGER">Manager</option>
        </select>
        <select
          value={form.is_active}
          onChange={(e) =>
            setForm({ ...form, is_active: e.target.value === "true" })
          }
          className="border p-2 mr-2"
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white p-2">
          {editing ? "Update" : "Add"} User
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm({
                id: "",
                role: "PERSONNEL",
                department: "",
                is_active: true,
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
            <th className="border p-2">Role</th>
            <th className="border p-2">Department</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border p-2">{user.id}</td>
              <td className="border p-2">{user.role}</td>
              <td className="border p-2">{user.department}</td>
              <td className="border p-2">
                {user.is_active ? "Active" : "Inactive"}
              </td>
              <td className="border p-2">
                <button
                  onClick={() => handleEdit(user)}
                  className="bg-yellow-500 text-white p-1 mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
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
            <h2 className="text-xl mb-4">Edit User</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="ID"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                required
                className="border p-2 mr-2 w-full mb-2"
              />
              <input
                type="text"
                placeholder="Department"
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                required
                className="border p-2 mr-2 w-full mb-2"
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="border p-2 mr-2 w-full mb-2"
              >
                <option value="PERSONNEL">Personnel</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="MANAGER">Manager</option>
              </select>
              <select
                value={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.value === "true" })
                }
                className="border p-2 mr-2 w-full mb-2"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <button
                type="submit"
                className="bg-blue-500 text-white p-2 w-full"
              >
                Update User
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditing(null);
                  setForm({
                    id: "",
                    role: "PERSONNEL",
                    department: "",
                    is_active: true,
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

export default User;
