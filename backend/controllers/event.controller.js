const Event = require("../models/event");

/* ---------------------------- Create New Event ---------------------------- */
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      startDateTime,
      endDateTime,
      color,
      linkedTaskId,
      reminder,
      recurring,
    } = req.body;

    if (!title || !startDateTime || !endDateTime) {
      return res.status(400).json({
        success: false,
        message:
          "All required fields (title, startDateTime, endDateTime) must be provided",
      });
    }

    const event = new Event({
      userId: req.user.id,
      title,
      description,
      startDateTime: new Date(startDateTime),
      endDateTime: new Date(endDateTime),
      color: color || "#000000",
      linkedTaskId: linkedTaskId || null,
      reminder: reminder ? new Date(reminder) : undefined,
      recurring: recurring || "None",
    });

    const savedEvent = await event.save();

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: savedEvent,
    });
  } catch (error) {
    console.error("createEvent error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/* ----------------------------- Get All Events ----------------------------- */

// exports.getAllEvents = async (req, res) => {
//   try {
//     let events;

//     if (req.user.role === "admin") {
//       events = await Event.find()
//         .populate("userId", "fullName email")
//         .populate("linkedTaskId", "title")
//         .sort({ createdAt: -1 });
//     } else {
//       events = await Event.find({ userId: req.user.id })
//         .populate("linkedTaskId", "title")
//         .sort({ createdAt: -1 });
//     }

//     res.json({ success: true, data: events });
//   } catch (err) {
//     console.error("getAllEvents error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
exports.getAllEvents = async (req, res) => {
  try {
    let events;

    if (req.user.role === "admin") {
      events = await Event.find()
        .populate("userId", "fullName email")
        .sort({ createdAt: -1 });
    } else {
      events = await Event.find({ userId: req.user.id })
        .sort({ createdAt: -1 });
    }

    res.json({ success: true, data: events });
  } catch (err) {
    console.error("getAllEvents error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ----------------------------- Get Event by ID ---------------------------- */
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      userId: req.user.id,
    })
      .populate("userId", "name email")
      .populate("linkedTaskId", "title");

    if (!event) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error("getEventById error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/* ------------------------------ Update Event ------------------------------ */
exports.updateEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      startDateTime,
      endDateTime,
      color,
      linkedTaskId,
      reminder,
      recurring,
    } = req.body;

    const updateData = {
      title,
      description,
      color,
      linkedTaskId,
      recurring,
      reminder: reminder ? new Date(reminder) : undefined,
      startDateTime: startDateTime ? new Date(startDateTime) : undefined,
      endDateTime: endDateTime ? new Date(endDateTime) : undefined,
    };

    const updatedEvent = await Event.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    console.error("updateEvent error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/* ------------------------------ Delete Event ------------------------------ */
exports.deleteEvent = async (req, res) => {
  try {
    const deletedEvent = await Event.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deletedEvent) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("deleteEvent error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
