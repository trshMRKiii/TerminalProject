import React, { useState, useEffect } from "react";
import { OperationsService } from "../../../lib/operations-service";
import { apiService } from "../../../lib/api-service";

function collection() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batchStats, setBatchStats] = useState(null);
  const [verifyingBatch, setVerifyingBatch] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch tickets on mount
  useEffect(() => {
    fetchTickets();
  }, []);

  // Calculate batch stats whenever tickets change
  useEffect(() => {
    if (tickets.length > 0) {
      const stats = OperationsService.calculateBatchStats(tickets);
      setBatchStats(stats);
    }
  }, [tickets]);

  // Filter tickets based on search term
  useEffect(() => {
    const filtered = tickets.filter(
      (ticket) =>
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.vehicle?.plate_number || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (ticket.driver?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (ticket.vehicle?.route || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );
    setFilteredTickets(filtered);
  }, [searchTerm, tickets]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTickets();
      setTickets(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBatch = async (batchName) => {
    try {
      setVerifyingBatch(batchName);
      // Find all tickets in this batch that are not already verified
      const batchTickets = tickets.filter(
        (t) =>
          !t.is_verified &&
          t.status !== "CANCELLED" &&
          OperationsService.getShiftBatchName(t.issued_at) === batchName,
      );

      if (batchTickets.length === 0) {
        setSuccessMessage("No pending tickets to verify in this batch");
        setTimeout(() => setSuccessMessage(""), 3000);
        setVerifyingBatch(null);
        return;
      }

      // Update verification status for batch tickets
      for (const ticket of batchTickets) {
        await apiService.patch(`/tickets/${ticket.id}/`, {
          is_verified: true,
        });
      }

      setSuccessMessage(
        `${batchTickets.length} ticket(s) in ${batchName} verified successfully!`,
      );
      setTimeout(() => setSuccessMessage(""), 3000);

      // Refresh tickets
      fetchTickets();
    } catch (err) {
      setError(err.message);
      console.error("Error verifying batch:", err);
    } finally {
      setVerifyingBatch(null);
    }
  };

  const handleResetAmount = async (ticketId) => {
  try {
    // If no ticketId provided, collect all verified tickets (end of day)
    if (!ticketId) {
      const verifiedTickets = tickets.filter(t => t.is_verified && t.status !== "COLLECTED");
      for (const ticket of verifiedTickets) {
        await apiService.patch(`/tickets/${ticket.id}/`, {
          collection_amount: 0,
          status: "COLLECTED"
        });
      }
      setSuccessMessage(`${verifiedTickets.length} ticket(s) collected successfully!`);
    } else {
      // Collect single ticket
      await apiService.patch(`/tickets/${ticketId}/`, {
        collection_amount: 0,
        status: "COLLECTED"
      });
      setSuccessMessage(`Ticket ${ticketId} amount reset to 0`);
    }
    fetchTickets();
    setTimeout(() => setSuccessMessage(""), 3000);
  } catch (err) {
    setError(err.message);
    console.error("Error resetting collection amount:", err);
  }
};


  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount || 0);
  };

  return (
    <>
      <div className="p-6">
        <header>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Tally & Collections
            </h1>
            <p className="text-muted-foreground">
              Automated recording (₱10/dispatch).
            </p>
          </div>
        </header>

        <div className="flex flex-row justify-around gap-6 mt-6">
          {/* Section 1: Shift Tally */}
          <div className="flex-1">
            <div className="space-y-4">
              <div className="border-2 border-gray-200 rounded-lg p-4 flex flex-row justify-between">
                <div><p className="text-sm font-semibold text-muted-foreground mb-2">
                  Total Verified Revenue
                </p>
                <p className="text-3xl font-bold">
                  {batchStats
                    ? formatCurrency(batchStats.totalVerified)
                    : "₱0.00"}
                </p></div>
                <button type="button" className='border-2 border-black-200 rounded-2xl p-0.5 cursor-pointer' onClick={() => handleResetAmount()}>Collect Amount</button>
              </div>

              <div className="space-y-3">
                {/* Batch 1 */}
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <p className="font-semibold">Batch 1 (6am-3pm)</p>
                  {batchStats && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Revenue:
                        </span>
                        <span className="font-bold">
                          {formatCurrency(batchStats.batch1.total)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Dispatches:
                        </span>
                        <span className="font-bold">
                          {batchStats.batch1.count}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Pending:
                        </span>
                        <span className="font-bold text-yellow-600">
                          {batchStats.batch1.pending}
                        </span>
                      </div>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleVerifyBatch("Batch 1")}
                    disabled={verifyingBatch === "Batch 1"}
                    className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {verifyingBatch === "Batch 1"
                      ? "Verifying..."
                      : "VERIFY Batch 1"}
                  </button>
                </div>

                {/* Batch 2 */}
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <p className="font-semibold">Batch 2 (3pm-7pm)</p>
                  {batchStats && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Revenue:
                        </span>
                        <span className="font-bold">
                          {formatCurrency(batchStats.batch2.total)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Dispatches:
                        </span>
                        <span className="font-bold">
                          {batchStats.batch2.count}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Pending:
                        </span>
                        <span className="font-bold text-yellow-600">
                          {batchStats.batch2.pending}
                        </span>
                      </div>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleVerifyBatch("Batch 2")}
                    disabled={verifyingBatch === "Batch 2"}
                    className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {verifyingBatch === "Batch 2"
                      ? "Verifying..."
                      : "VERIFY Batch 2"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Collection Log */}
          <div className="flex-1">
            <div className="space-y-4">
              <div className="flex flex-row justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold">Collection Log</h2>
                  <p className="text-sm text-muted-foreground">
                    Recent collections and verification status
                  </p>
                </div>
              </div>

              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-xs"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {successMessage && (
                <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm font-medium">
                  {successMessage}
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 text-xs font-semibold">
                        Ticket ID
                      </th>
                      <th className="text-left p-3 text-xs font-semibold">
                        Time
                      </th>
                      <th className="text-left p-3 text-xs font-semibold">
                        Issuer
                      </th>
                      <th className="text-left p-3 text-xs font-semibold">
                        Vehicle
                      </th>
                      <th className="text-left p-3 text-xs font-semibold">
                        Driver
                      </th>                     
                      <th className="text-left p-3 text-xs font-semibold">
                        Verified
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center p-4 text-muted-foreground"
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center p-4 text-red-500"
                        >
                          Error: {error}
                        </td>
                      </tr>
                    ) : filteredTickets.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center p-4 text-muted-foreground"
                        >
                          No tickets found
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3 text-sm">{ticket.id}</td>
                          <td className="p-3 text-sm">
                            {formatTime(ticket.issued_at)}
                          </td>
                          {/* to be edit pag may auth na*/}
                          <td className="p-3 text-sm">N/A</td>
                          <td className="p-3 text-sm">
                            {ticket.vehicle?.plate_number || "N/A"}
                          </td>
                          <td className="p-3 text-sm">
                            {ticket.driver?.name || "N/A"}
                          </td>
                          
                          <td className="p-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                ticket.is_verified
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {ticket.is_verified ? "✓ Yes" : "○ No"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default collection;
