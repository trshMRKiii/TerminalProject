import React, { useState, useEffect } from "react";
import { apiService } from "../../lib/api-service";
import BatchModal from "../../components/ui/batch-modal";

const STAT_CARDS = [
  { label: "Active Dispatch", key: "activeDispatch", bg: "bg-blue-100", color: "text-blue-600" },
  { label: "Tickets Today", key: "ticketsToday", bg: "bg-green-100", color: "text-green-600" },
  { label: "Available Jeeps", key: "availableJeeps", bg: "bg-purple-100", color: "text-purple-600" },
  { label: "Drivers On Duty", key: "driversOnDuty", bg: "bg-orange-100", color: "text-orange-600" },
];

function Dashboard() {
  const [stats, setStats] = useState({
    activeDispatch: [],
    ticketsToday: [],
    availableJeeps: [],
    driversOnDuty: [],
    activeOnTrip: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [tickets, vehicles, drivers] = await Promise.all([
        apiService.getTickets(),
        apiService.getVehicles(),
        apiService.getDrivers(),
      ]);

      const today = new Date().toISOString().split("T")[0];
      const activeDispatch = tickets.filter((t) => t.status === "ISSUED").slice(0, 5);
      const activeOnTrip = tickets.filter((t) => t.status === "DISPATCHED").slice(0, 5);
      const ticketsToday = tickets.filter((t) => t.issued_at.split("T")[0] === today && t.status !== "CANCELLED").slice(0, 10);

      setStats({
        activeDispatch,
        activeOnTrip,
        ticketsToday,
        availableJeeps: vehicles.filter((v) => v.status === "AVAILABLE"),
        driversOnDuty: drivers.filter((d) => d.status === "ACTIVE"),
      });
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleBatchSelect = async (batch) => {
    try {
      await apiService.updateTicket(selectedTicket.id, { batch });
      await fetchDashboardData();
    } catch (err) {
      setError("Failed to update ticket batch");
    } finally {
      setShowBatchModal(false);
      setSelectedTicket(null);
    }
  };

  const handleDispatch = async (ticket) => {
    try {
      await apiService.updateTicket(ticket.id, { status: "DISPATCHED" });
      await fetchDashboardData();
    } catch (err) {
      console.error("Error fetching dispatch data:", err);
      setError("Failed to dispatch ticket");
    }
  };

  const handleReturn = async (ticket) => {
  try {
    const vehicle = ticket.vehicle;
    await apiService.patch(`/vehicles/${vehicle.id}/`, {
      status: "AVAILABLE",
      active_driver: null,
    });

    await apiService.patch(`/tickets/${ticket.id}/`, {
      status: "RETURNED",
    });

    await fetchDashboardData();
  } catch (err) {
    setError(err.message);
  }
};

  if (loading && stats.activeDispatch.length === 0) {
    return <div className="p-6 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, key, bg, color }) => (
          <div key={key} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats[key].length}</p>
              </div>
              <div className={`p-2 ${bg} rounded`}>
                <div className={`w-6 h-6 ${color}`}>📊</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Dispatch & On Trip Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Dispatch Queue */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Active Dispatch Queue</h2>
          </div>
          <div className="overflow-y-auto max-h-80">
            {stats.activeDispatch.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {stats.activeDispatch.map((ticket) => (
                  <div key={ticket.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{ticket.id}</p>
                        <p className="text-sm text-gray-600">{ticket.route}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        ISSUED
                      </span>
                    </div>
                    <div className="flex gap-2">
                      
                      <button
                        onClick={() => handleDispatch(ticket)}
                        className="flex-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Dispatch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">No active dispatch</div>
            )}
          </div>
        </div>

        {/* Active On Trip */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Active On Trip</h2>
          </div>
          <div className="overflow-y-auto max-h-80">
            {stats.activeOnTrip.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {stats.activeOnTrip.map((ticket) => (
                  <div key={ticket.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{ticket.id}</p>
                        <p className="text-sm text-gray-600">{ticket.route}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        DISPATCHED
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {ticket.batch && <span>Batch: {ticket.batch}</span>}
                    </div>
                    <button
                      onClick={() => handleReturn(ticket)}
                      className="w-full px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      Return
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">No active on trip</div>
            )}
          </div>
        </div>
      </div>

      {showBatchModal && selectedTicket && (
        <BatchModal
          ticket={selectedTicket}
          onBatchSelect={handleBatchSelect}
          onClose={() => {
            setShowBatchModal(false);
            setSelectedTicket(null);
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;
