import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const DnDCalendar = withDragAndDrop(Calendar);

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const API_URL = "http://localhost:5000/api/events";

export default function EventPage() {
  const [events, setEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    id: null,
    title: "",
    desc: "",
    start: "",
    end: "",
    color: "#000000",
  });

  // ---------------- HELPER ----------------
  const getToken = () => localStorage.getItem("token");

  const getTextColor = (hexColor) => {
    const color = hexColor ? hexColor.replace("#", "") : "000000";
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128 ? "white" : "black";
  };

  const formatDateTime = (d) => {
    if (!d) return "";
    try {
      return format(new Date(d), "PPpp");
    } catch {
      return "";
    }
  };

  const getEventsForDate = (date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const filtered = events.filter(
      (e) => e.start >= dayStart && e.start <= dayEnd
    );
    return Array.from(new Map(filtered.map((e) => [e.title, e])).values());
  };

  // ---------------- FETCH EVENTS ----------------
  const fetchEvents = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      const arr = Array.isArray(data) ? data : data?.data ?? [];
      const formatted = arr.map((ev) => ({
        id: ev._id,
        title: ev.title,
        desc: ev.description,
        start: new Date(ev.startDateTime),
        end: new Date(ev.endDateTime),
        color: ev.color || "#000000",
      }));
      setEvents(formatted);
    } catch (err) {
      console.error("fetchEvents error:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // ---------------- ADD EVENT ----------------
  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) {
      alert("Please enter a title!");
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      // Extract userId from JWT
      const decoded = JSON.parse(atob(token.split(".")[1]));
      const body = {
        userId: decoded.id,
        title: newEvent.title,
        description: newEvent.desc,
        startDateTime: newEvent.start,
        endDateTime: newEvent.end,
        color: newEvent.color,
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      // console.log(" Add Event Response:", data);

      if (data.success) {
        // const ev = data.event;
        const ev = data.data;

        setEvents([
          ...events,
          {
            id: ev._id,
            title: ev.title,
            desc: ev.description,
            start: new Date(ev.startDateTime),
            end: new Date(ev.endDateTime),
            color: ev.color || "#000000",
          },
        ]);
        setShowAddModal(false);
      } else {
        alert(data.message || "Failed to add event");
      }
    } catch (err) {
      console.error("Error adding event:", err);
    }
  };

  // ---------------- UPDATE EVENT ----------------
  const handleUpdateEvent = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const body = {
        title: newEvent.title,
        description: newEvent.desc,
        startDateTime: newEvent.start,
        endDateTime: newEvent.end,
        color: newEvent.color,
      };

      const res = await fetch(`${API_URL}/${newEvent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setEvents(
          events.map((e) =>
            e.id === newEvent.id
              ? {
                  ...e,
                  title: newEvent.title,
                  desc: newEvent.desc,
                  start: new Date(newEvent.start),
                  end: new Date(newEvent.end),
                  color: newEvent.color,
                }
              : e
          )
        );
        setShowEditModal(false);
      } else {
        alert(data.message || "Failed to update event");
      }
    } catch (err) {
      console.error("Error updating event:", err);
    }
  };

  // ---------------- DELETE EVENT ----------------
  const handleDeleteEvent = async (event) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/${event.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setEvents(events.filter((e) => e.id !== event.id));
        setShowEditModal(false);
      } else {
        alert(data.message || "Failed to delete event");
      }
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  // ---------------- DRAG & RESIZE ----------------
  const updateEventTime = async (eventId, start, end) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ startDateTime: start, endDateTime: end }),
      });

      const data = await res.json();
      if (data.success) {
        setEvents(
          events.map((e) => (e.id === eventId ? { ...e, start, end } : e))
        );
      } else {
        console.warn("Failed to update event time", data.message);
      }
    } catch (err) {
      console.error("Error updating event time:", err);
    }
  };

  // ---------------- SLOT HANDLERS ----------------
  const handleSelectSlot = ({ start }) => {
    if (showEditModal || showMoreModal) return;
    setNewEvent({
      id: null,
      title: "",
      desc: "",
      start,
      end: start,
      color: "#000000",
    });
    setShowAddModal(true);
  };

  const handleSelectEvent = (event) => {
    if (showAddModal || showMoreModal) return;
    setSelectedEvent(event);
    setNewEvent({ ...event });
    setShowEditModal(true);
  };

  // ---------------- CUSTOM COMPONENTS ----------------
  return (
    <div className="bg-gray-100 min-h-screen w-full">
      <div className="max-w-7xl mx-auto py-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transition-all">
          <DnDCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable
            draggableAccessor={() => true}
            resizable
            onEventDrop={({ event, start, end }) =>
              updateEventTime(event.id, start, end)
            }
            onEventResize={({ event, start, end }) =>
              updateEventTime(event.id, start, end)
            }
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: event.color,
                color: getTextColor(event.color),
                borderRadius: "6px",
                fontWeight: 600,
                padding: "4px 6px",
                cursor: "pointer",
              },
            })}
            // components={{ ...components }}
            style={{ height: 600 }}
            // popup
          />
        </div>
      </div>

      {/* --- ADD MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/40 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[500px] max-w-[500px] relative">
            <h2 className="text-2xl font-semibold mb-5 text-gray-800 text-center">
              Add New Event
            </h2>

            <div className="mb-3">
              <label className="block text-md font-medium text-gray-600 mb-1">
                Title
              </label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none"
                placeholder="Enter event title"
              />
            </div>

            <div className="mb-3">
              <label className="block text-md font-medium text-gray-600 mb-1">
                Description
              </label>
              <textarea
                value={newEvent.desc}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, desc: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none"
                placeholder="Enter description"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-md font-medium text-gray-600 mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={
                    newEvent.start
                      ? format(newEvent.start, "yyyy-MM-dd'T'HH:mm")
                      : ""
                  }
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      start: new Date(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-md font-medium text-gray-600 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={
                    newEvent.end
                      ? format(newEvent.end, "yyyy-MM-dd'T'HH:mm")
                      : ""
                  }
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, end: new Date(e.target.value) })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-md font-medium text-gray-600 mb-1">
                Choose Event Color
              </label>
              <input
                type="color"
                value={newEvent.color || "#000000"}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, color: e.target.value })
                }
                className="w-20 h-10 rounded-full cursor-pointer"
              />
            </div>

            <button
              onClick={handleAddEvent}
              className="w-full text-md py-2 bg-black text-white rounded-md hover:bg-gray-900 mt-6 transition"
            >
              Add Event
            </button>

            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-black text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {showEditModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/40 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[500px] max-w-[500px] relative">
            <h2 className="text-2xl font-semibold mb-5 text-gray-800 text-center">
              Edit Event
            </h2>

            <div className="mb-3">
              <label className="block text-md font-medium text-gray-600 mb-1">
                Title
              </label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none"
              />
            </div>

            <div className="mb-3">
              <label className="block text-md font-medium text-gray-600 mb-1">
                Description
              </label>
              <textarea
                value={newEvent.desc}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, desc: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-md font-medium text-gray-600 mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={
                    newEvent.start
                      ? format(newEvent.start, "yyyy-MM-dd'T'HH:mm")
                      : ""
                  }
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      start: new Date(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-md font-medium text-gray-600 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={
                    newEvent.end
                      ? format(newEvent.end, "yyyy-MM-dd'T'HH:mm")
                      : ""
                  }
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, end: new Date(e.target.value) })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-md font-medium text-gray-600 mb-1">
                Choose Event Color
              </label>
              <input
                type="color"
                value={newEvent.color || "#000000"}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, color: e.target.value })
                }
                className="w-20 h-10 rounded-full cursor-pointer"
              />
            </div>

            <div className="flex justify-between mt-6">
              {/* <button onClick={() => handleDeleteEvent(selectedEvent)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition">Delete</button> */}
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition"
              >
                Delete
              </button>
              <button
                onClick={handleUpdateEvent}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition"
              >
                Update
              </button>
            </div>

            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-black text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      {showConfirmDelete && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/40 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[400px] max-w-[90%] relative text-center">
            <div className="text-xl font-bold mb-4">Delete Confirmation</div>
            <p className="text-md text-gray-600 mb-5">
              Are you sure you want to delete this event?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteEvent(selectedEvent);
                  setShowConfirmDelete(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MORE MODAL --- */}
      {showMoreModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/40 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[500px] max-w-[500px] relative h-[400px] overflow-y-auto scrollbar-hide scrollable-container">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 text-center">
              All Events
            </h2>

            {selectedDateEvents.map((ev) => (
              <div
                key={ev.id}
                className="border-b border-gray-200 py-3 px-2 hover:bg-gray-50 rounded-md mb-2 cursor-pointer"
                onClick={() => {
                  setSelectedEvent(ev);
                  setNewEvent(ev);
                  setShowMoreModal(false);
                  setShowEditModal(true);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800 text-2xl">
                      {ev.title}
                    </p>
                    <p className="text-md text-gray-500 mt-1">
                      {ev.desc || ""}
                    </p>
                    <div className="flex justify-between items-center gap-20">
                      <div>
                        <p className="font-medium">Start:</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDateTime(ev.start)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">End:</p>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(ev.end)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowMoreModal(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-black text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
