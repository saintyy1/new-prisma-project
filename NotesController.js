import userController from './UsersController.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Handle note creation for user
let createNoteAsync = async (userId, content) => {
    // Ensure userId is parsed as an integer
    const parsedUserId = parseInt(userId, 10);

    // Check if the user exists
    const user = await userController.getUserAsync(parsedUserId);
    
    if (!user) {
        throw new Error('User does not exist'); // You can throw an error or return a specific message
    }

    // Create the new note if the user exists
    const newNote = await prisma.notes.create({
        data: { 
            content: content,
            userId: parsedUserId, // Associate the note with the user's ID
            updatedAt: null // Optional: explicitly set to null if needed
        },
        select: { createdAt: true } // Ensure createdAt is returned
    });
    return newNote;
};


// Handle Read operation for all notes by a user
let getNotesAsync = async (userId) => {
    // check if the user exists
    const user = await userController.getUserAsync(userId);
    if (!user) {
        throw new Error(`User with ID ${id} not found`);
    }

    // Fetch the single note for the user
    const userNotes = await prisma.notes.findMany({
        where: {
            userId: userId
        },
    });
    return userNotes;
}; 

// Handle single note Read operation
let getNoteAsync = async (userId, noteId) => {
    // Check if the user exists
    const user = await userController.getUserAsync(userId);
    if (!user) {
        throw new Error(`User with ID ${id} not found`);
    }

    // Fetch the single note for the user
    const userNote = await prisma.notes.findUnique({
        where: {
            userId: userId,
            noteId: noteId
        },
    });
    return userNote;
};

// Handle Update Operation for a note
let updateNoteAsync = async (userId, noteId, content) => {
    // Check if the user exists
    const user = await userController.getUserAsync(userId);
    if (!user) {
        throw new Error(`User with ID ${id} not found`);
    }

    // Check if the note belongs to the user before updating
    const note = await prisma.notes.findFirst({
        where: {
            userId: userId,
            noteId: noteId,
        },
    });

    // If the note exists, update it
    if (note) {
        const updatedNote = await prisma.notes.update({
            where: { noteId: noteId },
            data: { content: content, updatedAt: new Date(), },  select: { updatedAt: true } // Ensure updatedAt is returned
        });
        return updatedNote;
    } else {
        return null; // Note not found or does not belong to the user
    }
};

// Handle Delete Operation for a note
let deleteNoteAsync = async (userId, noteId) => {
    // Check if the user exists
    const user = await userController.getUserAsync(userId);
    if (!user) {
        throw new Error(`User with ID ${id} not found`);
    }

    // Check if the note belongs to the user before deleting
    const note = await prisma.notes.findFirst({
        where: {
            userId: userId,
            noteId: noteId
        },
    });

    if (note) {
        // Delete the note
        const deletedNote = await prisma.notes.delete({
            where: { noteId: noteId },
        });
        return deletedNote;
    } else {
        return null; // Note not found or does not belong to the user
    }
};

// Exporting the noteController with CRUD operations
const noteController = {
    createNoteAsync,
    getNotesAsync,
    getNoteAsync,
    updateNoteAsync,
    deleteNoteAsync,
};

export default noteController;
