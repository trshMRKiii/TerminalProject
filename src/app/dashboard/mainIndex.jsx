import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "../../components/ui/sidebar";
import Dashboard from "./Dashboard";
import Ticket from "./ticket/ticket";
import Collections from "./collection/collection";
import Vehicles from "./vehicle/vehicle";
import Drivers from "./driver/driver";
import StaffRegistry from "./user/user";
import Reports from "./report/report";

function mainIndex() {
  return (
    <Router>
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-muted border-r flex flex-col">
          {/* logo */}
          <div className="flex items-center px-4 py-4">
            <div className="bg-primary p-2 rounded-lg mr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-bus h-6 w-6 text-white"
              >
                <path d="M8 6v6"></path>
                <path d="M15 6v6"></path>
                <path d="M2 12h19.6"></path>
                <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path>
                <circle cx="7" cy="18" r="2"></circle>
                <path d="M9 18h5"></path>
                <circle cx="16" cy="18" r="2"></circle>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">
              Tanqui Dispatch
            </span>
          </div>

          {/* Navigation */}
          <Navbar />

          {/* User info */}
          <div className="mt-auto border-t p-4">
            <div className="flex items-center">
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">
                  Head Manager Sarah
                </p>
                <p className="text-xs font-medium text-muted-foreground lowercase">
                  MANAGER
                </p>
              </div>
              <button className="ml-auto h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-destructive">
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
                  className="lucide lucide-log-out h-4 w-4"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" x2="9" y1="12" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* Main body */}
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/Dashboard" element={<Dashboard />} />           
            <Route path="/Ticket" element={<Ticket />} />
            <Route path="/Collections" element={<Collections />} />
            <Route path="/Vehicles" element={<Vehicles />} />
            <Route path="/Drivers" element={<Drivers />} />
            <Route path="/StaffRegistry" element={<StaffRegistry />} />
            <Route path="/Reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default mainIndex;
