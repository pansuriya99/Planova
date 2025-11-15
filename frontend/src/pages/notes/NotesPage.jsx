import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  ArrowLeft,
  Trash2,
  Undo,
  Redo,
  Check,
  Pin,
  PinOff,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function NotesPage() {
  // ---------------- STATE VARIABLES ----------------
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState(null);
  const [history, setHistory] = useState({ title: [], content: [] });
  const [redoStack, setRedoStack] = useState({ title: [], content: [] });
  const [activeField, setActiveField] = useState(null);
  const [tagInputEditor, setTagInputEditor] = useState("");
  const [saved, setSaved] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const colorPickerRef = useRef(null);

  //  Refs for auto-resizing textareas
  const titleRef = useRef(null);
  const contentRef = useRef(null);

  // ---------------- COLOR OPTIONS ----------------
  const lightColors = [
    "#FEF2F2",
    "#FAFAFA",
    "#FFF7ED",
    "#F0F9FF",
    "#ECFEFF",
    "#F7FEE7",
    "#ECFDF5",
    "#FFFBEB",
    "#FAF5FF",
    "#F2F9EB",
    "#F9EBF3",
    "#EBEBF9",
  ];

  // ---------------- SORTING NOTES ----------------
  const sortNotes = (notes) => {
    return [...notes].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (a.pinned && b.pinned)
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (!a.pinned && !b.pinned)
        return new Date(a.createdAt) - new Date(b.createdAt);
      return 0;
    });
  };

  // ---------------- FETCH NOTES ON PAGE LOAD ----------------
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/notes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        // console.log("Fetched notes response:", data);

        if (data.success && Array.isArray(data.data)) {
          setNotes(sortNotes(data.data));
        } else {
          console.warn("No valid notes array found in API response");
          setNotes([]);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch notes.");
      }
    };

    fetchNotes();
  }, []);

  // ---------------- AUTO-RESIZE WHEN NOTE REOPENS ----------------
  useEffect(() => {
    if (draft) {
      if (titleRef.current) {
        titleRef.current.style.height = "auto";
        titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
      }
      if (contentRef.current) {
        contentRef.current.style.height = "auto";
        contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
      }
    }
  }, [draft?.title, draft?.content]);

  // ---------------- ADD NEW NOTE ----------------
  const addNote = (color) => {
    const tempId = Date.now().toString();
    const newNote = {
      _id: tempId,
      title: "",
      content: "",
      tags: [],
      color,
      pinned: false,
      isTemp: true,
      createdAt: new Date().toISOString(),
    };
    //  Don't add to UI yet (only open editor)
    setDraft(newNote);
    setShowColorPicker(false);
  };

  // ---------------- SAVE NOTE ----------------
  const saveDraft = async () => {
    if (!draft) return;
    if (!draft.title.trim() && !draft.content.trim()) {
      toast.error("Cannot save empty note!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      let url = "http://localhost:5000/api/notes";
      let method = "POST";

      if (draft._id && !draft.isTemp) {
        url = `http://localhost:5000/api/notes/${draft._id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(draft),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      //  Add to UI only after save
      setNotes((prev) => {
        const exists = prev.some((n) => n._id === data.note._id);
        if (exists) {
          return sortNotes(
            prev.map((n) => (n._id === data.note._id ? data.note : n))
          );
        } else {
          return sortNotes([...prev, data.note]);
        }
      });

      setDraft(data.note);
      setSaved(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ---------------- CLOSE NOTE EDITOR ----------------
  const closeEditor = () => {
    if (!draft.title.trim() && !draft.content.trim() && draft.isTemp) {
      //  Don't show in UI if unsaved empty
      setDraft(null);
      return;
    }
    if (!draft.title.trim() && !draft.content.trim()) {
      setNotes((prev) => prev.filter((n) => n._id !== draft._id));
    }
    setDraft(null);
    setHistory({ title: [], content: [] });
    setRedoStack({ title: [], content: [] });
    setActiveField(null);
    setTagInputEditor("");
    setSaved(false);
  };

  // ---------------- DELETE NOTE ----------------
  const confirmDelete = (noteId) => setShowConfirmDelete(noteId);
  const cancelDelete = () => setShowConfirmDelete(null);

  const deleteNote = async (noteId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/notes/${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      if (draft?._id === noteId) closeEditor();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setShowConfirmDelete(null);
    }
  };

  // ---------------- TOGGLE PIN ----------------
  const togglePin = async (note) => {
    try {
      const token = localStorage.getItem("token");
      const updatedNote = { ...note, pinned: !note.pinned };
      const res = await fetch(`http://localhost:5000/api/notes/${note._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedNote),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setNotes((prev) =>
        sortNotes(prev.map((n) => (n._id === note._id ? data.note : n)))
      );
      if (draft?._id === note._id) setDraft(data.note);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ---------------- HANDLE DRAFT CHANGE ----------------
  const handleDraftChange = (field, value) => {
    if (!draft) return;
    setSaved(false);
    setHistory((prev) => ({
      ...prev,
      [field]: [...prev[field], draft[field] ?? ""],
    }));
    setRedoStack((prev) => ({ ...prev, [field]: [] }));
    setDraft((prev) => ({ ...prev, [field]: value }));
    setActiveField(field);
  };

  // ---------------- UNDO & REDO ----------------
  const handleUndo = () => {
    if (!draft || !activeField) return;
    const fieldHistory = history[activeField];
    if (!fieldHistory.length) return;
    const prevValue = fieldHistory[fieldHistory.length - 1];
    setHistory((h) => ({ ...h, [activeField]: h[activeField].slice(0, -1) }));
    setRedoStack((r) => ({
      ...r,
      [activeField]: [draft[activeField], ...r[activeField]],
    }));
    setDraft((d) => ({ ...d, [activeField]: prevValue }));
  };

  const handleRedo = () => {
    if (!draft || !activeField) return;
    const redoValues = redoStack[activeField];
    if (!redoValues.length) return;
    const nextValue = redoValues[0];
    setRedoStack((r) => ({ ...r, [activeField]: r[activeField].slice(1) }));
    setHistory((h) => ({
      ...h,
      [activeField]: [...h[activeField], draft[activeField]],
    }));
    setDraft((d) => ({ ...d, [activeField]: nextValue }));
  };

  // ---------------- REMOVE TAG ----------------
  const removeTag = (index) => {
    setDraft((d) => ({ ...d, tags: d.tags.filter((_, i) => i !== index) }));
  };

  // ---------------- CLOSE COLOR PICKER ON OUTSIDE CLICK ----------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target))
        setShowColorPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------------- BUTTON DISABLE LOGIC ----------------
  const totalChars =
    (draft?.title?.trim().length || 0) +
    (draft?.content?.trim().length || 0) +
    (draft?.tags?.length || 0);

  const undoDisabled =
    !draft ||
    (!saved && (totalChars < 1 || history[activeField]?.length === 0));
  const redoDisabled =
    !draft ||
    (!saved && (totalChars < 2 || redoStack[activeField]?.length === 0));
  const saveDisabled = !draft || totalChars < 1;
  const deleteDisabled = !draft || totalChars < 1; //  disable delete if empty

  const undoColor = undoDisabled ? "#d1d5db" : "black";
  const redoColor = redoDisabled ? "#d1d5db" : "black";
  const saveColor = saveDisabled ? "#d1d5db" : "black";

  // ---------------- RENDER UI ----------------
  return (
    <div className="min-h-96 bg-gray-100 p-4 flex flex-col items-center">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      {/* Empty state */}
      {notes.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-20 text-gray-500 text-center">
          <img
            src="/src/assets/note.png"
            alt="No notes"
            className="w-40 h-40 mb-4 opacity-70"
          />
          <p className="text-lg font-medium">
            No notes yet. Add your first one!
          </p>
        </div>
      )}

      {/* Notes Grid */}
      <div className="grid gap-4 w-full max-w-6xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {notes.map((note) => (
          <div
            key={note._id}
            style={{ backgroundColor: note.color }}
            className="p-5 rounded-xl shadow-xl text-black flex flex-col justify-between relative cursor-pointer min-h-[180px] transition transform hover:scale-[1.03] break-words"
            onClick={() =>
              setDraft({
                ...note,
                title: note.title || "",
                content: note.content || "",
              })
            }
          >
            <h3 className="font-bold text-lg truncate">
              {note.title?.split("\n")[0] || "Untitled Note"}
            </h3>
            <p className="text-sm mt-2 break-words line-clamp-2">
              {note.content?.split("\n")[0] || "This is a default note."}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {note.tags.slice(-2).map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-gray-200 rounded text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Pin & Delete buttons */}
            <div className="flex items-center justify-end mt-4 gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(note);
                }}
                className="p-2 rounded-full bg-white shadow cursor-pointer"
              >
                {note.pinned ? <PinOff size={16} /> : <Pin size={16} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete(note._id);
                }}
                className="p-2 rounded-full bg-red-600 hover:bg-red-500 text-white shadow cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker((s) => !s);
          }}
          className="p-4 rounded-full bg-black text-white shadow-lg hover:scale-110 transition"
        >
          <Plus size={28} />
        </button>

        {/* Color Picker */}
        {showColorPicker && (
          <div
            ref={colorPickerRef}
            className="absolute bottom-20 right-0 w-32 flex flex-wrap gap-2 justify-center items-center p-3 bg-white shadow-md rounded-lg"
          >
            {lightColors.map((color, idx) => (
              <button
                key={idx}
                onClick={() => addNote(color)}
                style={{ backgroundColor: color }}
                className="w-5 h-5 rounded-full border border-gray-700 cursor-pointer hover:scale-110 transition"
              />
            ))}
          </div>
        )}
      </div>

      {/* Note Editor Modal */}
      {draft && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
          <div
            style={{ backgroundColor: draft.color }}
            className="w-full h-screen sm:w-full sm:h-screen md:w-[60vw] md:h-[70vh] lg:w-[60vw] lg:h-[70vh] p-6 sm:p-6 rounded-2xl shadow-lg relative flex flex-col"
          >
            {/* Top Toolbar */}
            <div className="flex justify-between items-center mb-4 sticky top-0 z-10 bg-transparent">
              <button
                onClick={closeEditor}
                className="flex items-center text-lg font-bold text-gray-700 cursor-pointer"
              >
                <ArrowLeft size={20} className="mr-1 font-bold mt-1" /> Back
              </button>

              <div className="flex gap-2 items-center">
                <button
                  onClick={handleUndo}
                  disabled={undoDisabled}
                  className="p-2 rounded-full bg-white cursor-pointer"
                >
                  <Undo size={18} color={undoColor} />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoDisabled}
                  className="p-2 rounded-full bg-white cursor-pointer"
                >
                  <Redo size={18} color={redoColor} />
                </button>
                <button
                  onClick={saveDraft}
                  disabled={saveDisabled}
                  className="p-2 rounded-full font-bold bg-white cursor-pointer"
                >
                  <Check size={18} color={saveColor} />
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto scrollable-container">
              <textarea
                ref={titleRef}
                value={draft.title}
                onFocus={() => setActiveField("title")}
                onChange={(e) => handleDraftChange("title", e.target.value)}
                className="w-full bg-transparent text-2xl font-semibold focus:outline-none resize-none overflow-hidden break-words mb-2"
                placeholder="Untitled Note"
                rows={1}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              />

              <textarea
                ref={contentRef}
                value={draft.content}
                onFocus={() => setActiveField("content")}
                onChange={(e) => handleDraftChange("content", e.target.value)}
                className="w-full bg-transparent text-lg focus:outline-none resize-none overflow-hidden break-words mb-2"
                placeholder="Start typing..."
                rows={1}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              />

              {/* Tags */}
              <div className="flex flex-wrap gap-2 items-center mb-2">
                {draft.tags.map((t, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 px-1 py-0 bg-gray-200 rounded text-sm"
                  >
                    {t.length > 10 ? t.slice(0, 10) + "..." : t}
                    <button
                      onClick={() => removeTag(i)}
                      className="text-red-500 font-bold text-lg pb-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex items-center justify-between mt-4 sticky bottom-0 bg-transparent pt-2">
              <div className="flex justify-between w-full">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="tag..."
                    value={tagInputEditor}
                    onChange={(e) => setTagInputEditor(e.target.value)}
                    className="flex-1 p-2 rounded text-sm focus:outline-none w-32"
                    maxLength={10}
                  />
                  <button
                    onClick={() => {
                      if (tagInputEditor.trim()) {
                        let tag = tagInputEditor.trim();
                        if (!tag.startsWith("#")) tag = "#" + tag;
                        setDraft((d) => ({
                          ...d,
                          tags: [...d.tags, tag],
                        }));
                        setTagInputEditor("");
                      }
                    }}
                    className="flex items-center p-2 h-9 w-9 rounded-full text-lg bg-white cursor-pointer"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* Delete */}
                <div>
                  <button
                    onClick={() => confirmDelete(draft._id)}
                    disabled={deleteDisabled}
                    className={`p-2 rounded-full ${
                      deleteDisabled
                        ? "bg-white text-[#d1d5db] cursor-pointer"
                        : "bg-red-600 text-white hover:bg-red-500"
                    } ml-2`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center">
            <div className="text-xl font-bold mb-4">Delete Confirmation</div>
            <p className="text-md text-gray-600 mb-5">
              Are you sure you want to delete this note?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteNote(showConfirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// in editor div delete btn disable if not click one time save btn
