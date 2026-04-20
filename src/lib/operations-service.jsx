import { SHIFTS, TICKET_FEE } from "./constants";
import { format } from "date-fns";

/**
 * OperationsService handles core business logic and data transformations.
 * Decouples domain logic from React components (SRP).
 */
export const OperationsService = {
  getShiftBatchName(dateInput) {
    const date = new Date(dateInput);
    const hour = date.getHours();

    if (hour >= SHIFTS.BATCH_1.startHour && hour < SHIFTS.BATCH_1.endHour) {
      return SHIFTS.BATCH_1.name;
    }
    if (hour >= SHIFTS.BATCH_2.startHour && hour < SHIFTS.BATCH_2.endHour) {
      return SHIFTS.BATCH_2.name;
    }
    return "Other";
  },

  isDriverBusy(driverId, tickets, vehicles) {
    const hasActiveTicket = tickets.some(
      (t) => t.driverId === driverId && t.status === "ISSUED",
    );
    const isOnTrip = vehicles.some(
      (v) => v.activeDriverId === driverId && v.status === "ON_TRIP",
    );
    return hasActiveTicket || isOnTrip;
  },

  isVehicleBusy(vehicleId, tickets) {
    return tickets.some(
      (t) => t.vehicleId === vehicleId && t.status === "ISSUED",
    );
  },

  calculateBatchStats(tickets) {
    const activeTickets = tickets.filter((t) => t.status !== "CANCELLED");

    const b1 = activeTickets.filter(
      (t) => this.getShiftBatchName(t.issuedAt) === SHIFTS.BATCH_1.name,
    );
    const b2 = activeTickets.filter(
      (t) => this.getShiftBatchName(t.issuedAt) === SHIFTS.BATCH_2.name,
    );

    return {
      batch1: {
        total: b1.reduce((sum, t) => sum + (t.collectionAmount || 0), 0),
        count: b1.length,
        pending: b1.filter((t) => !t.isVerified).length,
      },
      batch2: {
        total: b2.reduce((sum, t) => sum + (t.collectionAmount || 0), 0),
        count: b2.length,
        pending: b2.filter((t) => !t.isVerified).length,
      },
      totalVerified: activeTickets
        .filter((t) => t.isVerified)
        .reduce((sum, t) => sum + (t.collectionAmount || 0), 0),
    };
  },

  /**
   * Groups tickets by route and calculates financial summaries for reporting.
   */
  getRouteTallyReport(tickets, vehicles, dateFilter, batchFilter) {
    const filtered = tickets.filter((t) => {
      if (t.status === "CANCELLED") return false;
      const ticketDateStr = t.issuedAt.split("T")[0];
      if (ticketDateStr !== dateFilter) return false;

      if (batchFilter !== "ALL") {
        return this.getShiftBatchName(t.issuedAt) === batchFilter;
      }
      return true;
    });

    const matrix = {};
    const finance = {};

    // Initialize routes
    const allRoutes = Array.from(new Set(vehicles.map((v) => v.route)));
    allRoutes.forEach((r) => {
      matrix[r] = [];
      finance[r] = { trips: 0, revenue: 0 };
    });

    filtered.forEach((t) => {
      const vehicle = vehicles.find((v) => v.id === t.vehicleId);
      if (vehicle) {
        matrix[t.route].push({
          id: t.id,
          unit: vehicle.unitNumber,
          plate: vehicle.plateNumber,
          time: format(new Date(t.issuedAt), "h:mm a"),
        });

        finance[t.route].trips += 1;
        finance[t.route].revenue += t.collectionAmount || TICKET_FEE;
      }
    });

    return { matrix, finance };
  },
};
