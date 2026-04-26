import React, { useState, useEffect } from "react";
import { OperationsService } from "../../../lib/operations-service";
import { apiService } from "../../../lib/api-service";

function ticket() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [issuingTicket, setIssuingTicket] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [issueError, setIssueError] = useState("");

  // Fetch tickets, vehicles, and drivers on component mount
  useEffect(() => {
    fetchTickets();
    fetchVehicles();
    fetchDrivers();
  }, []);

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
          .includes(searchTerm.toLowerCase()),
    );
    setFilteredTickets(filtered.slice(0, 10)); // Show last 10
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

  const fetchVehicles = async () => {
    try {
      const data = await apiService.getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await apiService.getDrivers();
      setDrivers(data);
    } catch (err) {
      console.error("Error fetching drivers:", err);
    }
  };

  const handleVehicleChange = (e) => {
    const vehicleId = parseInt(e.target.value);
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    setSelectedVehicle(vehicle);
    if (vehicle && vehicle.active_driver) {
      // active_driver is an ID, so find the full driver object
      const driver = drivers.find((d) => d.id === vehicle.active_driver);
      setSelectedDriver(driver || null);
    } else {
      setSelectedDriver(null);
    }
  };

  const handleDriverChange = (driverId) => {
    const driver = drivers.find((d) => d.id === driverId);
    setSelectedDriver(driver);
    setShowDriverModal(false);
  };

  const handleIssueTicket = async () => {
    // Clear previous messages
    setSuccessMessage("");
    setIssueError("");

    // Validate selections
    if (!selectedVehicle) {
      setIssueError("Please select a vehicle");
      return;
    }
    if (!selectedDriver) {
      setIssueError("Please select a driver");
      return;
    }

    // Check if vehicle or driver is busy
    if (OperationsService.isVehicleBusy(selectedVehicle.id, tickets)) {
      setIssueError("This vehicle is already in use on an active ticket");
      return;
    }
    if (OperationsService.isDriverBusy(selectedDriver.id, tickets, vehicles)) {
      setIssueError("This driver is already assigned to an active ticket");
      return;
    }

    try {
      setIssuingTicket(true);

      // Generate a unique ticket ID (format: TICKET-YYYYMMDDHHMMSS)
      const now = new Date();
      const ticketId = `TICKET-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

      const ticketData = {
        id: ticketId,
        vehicle: selectedVehicle.id,
        driver: selectedDriver.id,
        route: selectedVehicle.route,
        status: "ISSUED",
        collection_amount: null,
        is_verified: false,
      };

      const response = await fetch("http://localhost:8000/api/tickets/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error response:", errorData);
        const errorMessage =
          errorData.detail ||
          JSON.stringify(errorData) ||
          "Failed to issue ticket";
        throw new Error(errorMessage);
      }

      const newTicket = await response.json();
      setSuccessMessage(`Ticket ${newTicket.id} issued successfully!`);

      // Refresh tickets list
      fetchTickets();

      // Reset form
      setSelectedVehicle(null);
      setSelectedDriver(null);
      setShowDriverModal(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setIssueError(err.message || "Error issuing ticket");
      console.error("Error issuing ticket:", err);
      console.log(
        "Ticket data sent:",
        ticketData ? JSON.stringify(ticketData, null, 2) : ticketData,
      );
      console.log("Error message:", err.message);
    } finally {
      setIssuingTicket(false);
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

  return (
    <>
      //header
      <div className="justify-center">
        <div>
          <div className="flex flex-row justify-between p-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Ticket Workflow
              </h1>
              <p className="text-muted-foreground">
                Manage and issue new trip tickets.
              </p>
            </div>
            <div>
              <a
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 no-print"
                href="/dashboard/reports"
              >
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
                  className="lucide lucide-history mr-2 h-4 w-4"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                  <path d="M12 7v5l4 2"></path>
                </svg>{" "}
                Print History
              </a>
            </div>
          </div>
        </div>
      </div>
      //body
      <div className="flex flex-row">
        <div>
          //section 1
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="text-2xl font-semibold leading-none tracking-tight">
              Issue Ticket
            </div>
            <div className="text-sm text-muted-foreground">
              Select vehicle to auto-fill driver credentials.
            </div>
          </div>
          <div>
            <p>Jeepney (Plate Number)</p>
            <select
              value={selectedVehicle?.id || ""}
              onChange={handleVehicleChange}
              className="w-full border p-2 mb-2"
            >
              <option value="">Select a vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate_number} ({vehicle.route})
                </option>
              ))}
            </select>
            {selectedVehicle && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 bg-muted/20 rounded-2xl border border-muted-foreground/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Assigned Driver
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDriverModal(!showDriverModal)}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary underline-offset-4 hover:underline rounded-md text-xs font-bold p-0 h-auto"
                    >
                      CHANGE DRIVER
                    </button>
                  </div>
                  {selectedDriver ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
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
                            className="lucide lucide-user h-5 w-5 text-primary"
                          >
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-bold">
                            {selectedDriver.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {selectedDriver.id}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Active Route
                        </label>
                        <div className="flex items-center p-3 bg-blue-50/50 text-blue-700 rounded-xl border border-blue-100">
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
                            className="lucide lucide-map-pin h-4 w-4 mr-2"
                          >
                            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          <span className="text-sm font-bold">
                            {selectedVehicle.route || "N/A"}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      No driver assigned
                    </div>
                  )}
                  {showDriverModal && (
                    <div className="border-t border-muted-foreground/10 pt-4 mt-4">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                        Select Driver
                      </label>
                      <select
                        value={selectedDriver?.id || ""}
                        onChange={(e) =>
                          handleDriverChange(parseInt(e.target.value))
                        }
                        className="w-full border p-2 rounded-md"
                      >
                        <option value="">Choose a driver...</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
            {successMessage && (
              <div className="p-3 mb-2 bg-green-100 text-green-800 rounded-md text-sm font-medium">
                {successMessage}
              </div>
            )}
            {issueError && (
              <div className="p-3 mb-2 bg-red-100 text-red-800 rounded-md text-sm font-medium">
                {issueError}
              </div>
            )}
            <button
              type="button"
              onClick={handleIssueTicket}
              disabled={issuingTicket || !selectedVehicle || !selectedDriver}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 w-full h-14 font-bold text-lg shadow-lg shadow-primary/20 rounded-xl"
            >
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
                className="lucide lucide-ticket mr-2 h-5 w-5"
              >
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
                <path d="M13 5v2"></path>
                <path d="M13 17v2"></path>
                <path d="M13 11v2"></path>
              </svg>
              {issuingTicket ? "Issuing..." : "Issue a Ticket"}
            </button>
          </div>
        </div>
        <div>
          //section 2
          <div className="flex flex-row">
            <div>
              <div className="text-2xl font-semibold leading-none tracking-tight">
                Recent Tickets
              </div>
              <div className="text-sm text-muted-foreground">
                Last 10 issued tickets for today.
              </div>
            </div>
            <div className="relative w-48 no-print">
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
                className="lucide lucide-search absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              <input
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-9 h-9 text-xs"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              ></input>
            </div>
          </div>
          <div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold">TICKET ID</th>
                  <th className="text-left p-2 font-semibold">ISSUER</th>
                  <th className="text-left p-2 font-semibold">VEHICLE</th>
                  <th className="text-left p-2 font-semibold">DRIVER</th>
                  <th className="text-left p-2 font-semibold">TIME</th>
                  <th className="text-left p-2 font-semibold">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center p-4 text-muted-foreground"
                    >
                      Loading tickets...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className="text-center p-4 text-red-500">
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
                    <tr key={ticket.id} className="border-b hover:bg-accent/50">
                      <td className="p-2">{ticket.id}</td>
                      <td className="p-2">
                        {ticket.active_user_name || "N/A"}
                      </td>
                      <td className="p-2">
                        {ticket.vehicle?.plate_number || "N/A"}
                      </td>
                      <td className="p-2">{ticket.driver?.name || "N/A"}</td>
                      <td className="p-2">{formatTime(ticket.issued_at)}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            ticket.status === "ISSUED"
                              ? "bg-blue-100 text-blue-800"
                              : ticket.status === "DISPATCHED"
                                ? "bg-yellow-100 text-yellow-800"
                                : ticket.status === "COLLECTED"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <a
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 w-full font-bold uppercase tracking-wider text-xs h-12"
              href="/dashboard/report"
            >
              View Full History
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default ticket;
