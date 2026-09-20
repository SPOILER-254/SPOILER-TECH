const { gmd } = require("../black_hat");
const {
    initNotesDB,
    addNote,
    getNote,
    getAllNotes,
    updateNote,
    deleteNote,
    deleteAllNotes,
} = require("../black_hat/database/notes");
const { getContextInfo } = require("../black_hat/contextInfo");

initNotesDB();

function getUserName(jid) {
    return jid.split("@")[0];
}

gmd(
    {
        pattern: "notes",
        react: "📝",
        category: "notes",
        description: "Show all notes commands",
    },
    async (from, Gifted, conText) => {
        const helpText = `📝 *NOTES COMMANDS*

*Add a note:*
.addnote <text>
.newnote <text>
.makenote <text>

*Get a specific note:*
.getnote <number>
.listnote <number>

*Get all your notes:*
.getnotes
.getallnotes
.listnotes

*Update a note:*
.updatenote <number> <new text>

*Delete a specific note:*
.delnote <number>
.deletenote <number>
.removenote <number>

*Delete all your notes:*
.delallnotes
.removeallnotes
.deleteallnotes

_Notes are personal and stored securely in the database._`;

        return await Gifted.sendMessage(from, {
            text: helpText,
            contextInfo: await getContextInfo(),
        });
    },
);

gmd(
    {
        pattern: "addnote",
        aliases: ["newnote", "makenote", "createnote"],
        react: "📝",
        category: "notes",
        description: "Add a new note",
    },
    async (from, Gifted, conText) => {
        const { sender, q, quoted } = conText;

        let noteContent = q?.trim() || "";

        if (!noteContent && quoted) {
            const quotedMsg = quoted.message || quoted;
            if (quotedMsg.conversation) {
                noteContent = quotedMsg.conversation;
            } else if (quotedMsg.extendedTextMessage?.text) {
                noteContent = quotedMsg.extendedTextMessage.text;
            } else if (quotedMsg.imageMessage?.caption) {
                noteContent = quotedMsg.imageMessage.caption;
            } else if (quotedMsg.videoMessage?.caption) {
                noteContent = quotedMsg.videoMessage.caption;
            }
        }

        if (!noteContent) {
            return await Gifted.sendMessage(from, {
                text: `❌ Hey @${getUserName(sender)}, provide content for your note.\n\nUsage: ${botPrefix}addnote <your note text>\nOr reply to a message with ${botPrefix}addnote`,
                contextInfo: await getContextInfo([sender]),
            });
        }

        const note = await addNote(sender, noteContent);
        return await Gifted.sendMessage(from, {
            text: `✅ Hey @${getUserName(sender)}, Note #${note.noteNumber} saved!\n\n📝 "${note.content}"`,
            contextInfo: await getContextInfo([sender]),
        });
    },
);

gmd(
    {
        pattern: "getnote",
        aliases: ["listnote", "viewnote", "shownote"],
        react: "📄",
        category: "notes",
        description: "Get a specific note by number",
    },
    async (from, Gifted, conText) => {
        const { sender, q, botPrefix } = conText;

        if (!q || isNaN(parseInt(q))) {
            return await Gifted.sendMessage(from, {
                text: `❌ Hey @${getUserName(sender)}, provide a note number.\n\nUsage: ${botPrefix}getnote <number>`,
                contextInfo: await getContextInfo([sender]),
            });
        }

        const noteNumber = parseInt(q);
        const note = await getNote(sender, noteNumber);

        if (!note) {
            return await Gifted.sendMessage(from, {
                text: `❌ Hey @${getUserName(sender)}, Note #${noteNumber} not found.`,
                contextInfo: await getContextInfo([sender]),
            });
        }

        return await Gifted.sendMessage(from, {
            text: `📝 Hey @${getUserName(sender)}, here's *Note #${note.noteNumber}*\n\n${note.content}\n\n_Created: ${note.createdAt.toLocaleString()}_`,
            contextInfo: await getContextInfo([sender]),
        });
    },
);

gmd(
    {
        pattern: "getnotes",
        aliases: [
            "getallnotes",
            "listnotes",
            "allnotes",
            "mynotes",
            "viewnotes",
        ],
        react: "📋",
        category: "notes",
        description: "Get all your notes",
    },
    async (from, Gifted, conText) => {
        const { sender, botPrefix } = conText;

        const notes = await getAllNotes(sender);

        if (notes.length === 0) {
            return await Gifted.sendMessage(from, {
                text: `📭 Hey @${getUserName(sender)}, you have no notes yet.\n\nUse ${botPrefix}addnote <text> to create one!`,
                contextInfo: await getContextInfo([sender]),
            });
        }

        let text = `📋 Hey @${getUserName(sender)}, here are *YOUR NOTES (${notes.length})*\n\n`;
        notes.forEach((note) => {
            const preview =
                note.content.length > 50
                    ? note.content.substring(0, 50) + "..."
                    : note.content;
            text += `*#${note.noteNumber}* - ${preview}\n`;
        });
        text += `\n_Use ${botPrefix}getnote <number> to view full note_`;

        return await Gifted.sendMessage(from, {
            text,
            contextInfo: await getContextInfo([sender]),
        });
    },
);

gmd(
    {
        pattern: "updatenote",
        aliases: ["editnote", "modifynote"],
        react: "✏️",
        category: "notes",
        description: "Update an existing note",
    },
    async (from, Gifted, conText) => {
        const { sender, q, botPrefix } = conText;

        if (!q || q.trim() === "") {
            return await Gifted.sendMessage(from, {
                text: `❌ Hey @${getUserName(sender)}, provide note number and new content.\n\nUsage: ${botPrefix}updatenote <number> <new text>`,
                contextInfo: await getContextInfo([sender]),
            });
        }

        const parts = q.trim().split(/\s+/);
        const noteNumber = parseInt(parts[0]);

        if (isNaN(noteNumber)) {
            return await Gifted.sendMessage(from, {
                text: `❌ Hey @${getUserName(sender)}, first argument must be a note number.\n\nUsage: ${botPrefix}updatenote <number> <new text>`,
                contextInfo: await getContextInfo([sender]),
            });
        }

        const newContent = parts.slice(1).join(" ");
        if (!newContent) {
            return await Gifted.sendMessage(from, {
                text: `❌ Hey @${getUserName(sender)}, provide new content for the note.\n\nUsage: ${botPrefix}updatenote <number> <new text>`,
                contextInfo: await getContextInfo([sender]),
            });
        }

        const note = await updateNote(sender, noteNumber, newContent);

        if (!note) {
            return await Gifted.sendMessage(from, {
                text: `❌ Hey @${getUserName(sender)}, Note #${noteNumber} not found.`,
                contextInfo: await getContextInfo([sender]),
            });
        }

        return await Gifted.sendMessage(from, {
            text: `✅ Hey @${getUserName(sender)}, Note #${note.noteNumber} updated!\n\n📝 "${note.content}"`,
            contextInfo: await getContextInfo([sender]),
        });
    },
);

gmd(
    {
        pattern: "delnote",
        aliases: ["deletenote", "removenote", "rmnote"],
        react: "🗑️",
        category: "notes",
        description: "Delete a specific note",
    },
    async (from, Gifted, conText) => {
        const { sender, q, botPrefix } = conText;

        if (!q || isNaN(parseInt(q))) {
            return await Gifted.sendMessage(from, {
                text: `❌ Hey @${getUserName(sender)}, provide a note number to delete.\n\nUsage: ${botPrefix}delnote <number>`,
                contextInfo: await getContextInfo([sender]),
            });
        }

        const noteNumber = parseInt(q);
        const deleted = await deleteNote(sender, noteNumber);

        if (!deleted) {
            return await Gifted.sendMessage(from, {
                text: `❌ Hey @${getUserName(sender)}, Note #${noteNumber} not found.`,
                contextInfo: await getContextInfo([sender]),
            });
        }

        return await Gifted.sendMessage(from, {
            text: `✅ Hey @${getUserName(sender)}, Note #${noteNumber} deleted!`,
            contextInfo: await getContextInfo([sender]),
        });
    },
);

gmd(
    {
        pattern: "delallnotes",
        aliases: ["deleteallnotes", "removeallnotes", "clearnotes", "delnotes"],
        react: "🗑️",
        category: "notes",
        description: "Delete all your notes",
    },
    async (from, Gifted, conText) => {
        const { sender } = conText;

        const count = await deleteAllNotes(sender);

        if (count === 0) {
            return await Gifted.sendMessage(from, {
                text: `📭 Hey @${getUserName(sender)}, you have no notes to delete.`,
                contextInfo: await getContextInfo([sender]),
            });
        }

        return await Gifted.sendMessage(from, {
            text: `✅ Hey @${getUserName(sender)}, deleted ${count} note${count > 1 ? "s" : ""}!`,
            contextInfo: await getContextInfo([sender]),
        });
    },
);

module.exports = {};
