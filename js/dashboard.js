let userId = sessionStorage.getItem('userId');
let logoutBtn = document.querySelector('.logoutBtn');

if (userId) {
    let baseURL = `http://localhost:8000/api/users/${userId}/notes`;

    let notesContainer = document.querySelector('#notes-container');
    let ideaForm = document.querySelector('#ideaForm');
    let contentInput = document.querySelector('#contentInput');
    let noteIdInput = document.querySelector('#noteIdInput');

    // Resets the noteId value when the modal is closed 
    let cancelButton = document.getElementById('cancelButton');
    cancelButton.addEventListener('click', () => {
        // Clear the noteId when cancel is pressed
        if(noteIdInput) {
            noteIdInput.value = ''; // Set noteIdInput to an empty string
        }

        ideaForm.reset(); // Reset the form fields if necessary

        // Close the modal
        let modal = bootstrap.Modal.getInstance(document.getElementById('ideaModal'));
        if (modal) {
            modal.hide(); // Hide the modal
        }
    });

    // Load notes on page load
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            let response = await fetch(baseURL, { method: 'GET' });
            let notes = await response.json();

            notesContainer.innerHTML = ''; // Clear previous content
            if (notes.length > 0) {
                notes.forEach(note => {
                    let noteElement = document.createElement('div');
                    noteElement.classList.add('note');

                    // Format timestamps
                    let createdAt = new Date(note.createdAt).toLocaleString();
                    let updatedAt = new Date(note.updatedAt).toLocaleString();

                    let displayDate = note.updatedAt ? 
                    `Last updated on: ${updatedAt}` : 
                    `Created on: ${createdAt}`;

                    noteElement.innerHTML = `
                        <div class="card mb-2">
                            <div class="card-body">
                                <span class="text-muted mb-2">${displayDate}</span> <!-- Display creation or updated time -->
                                <p>${note.content}</p>
                                <button class="btn btn-primary btn-sm me-2 editBtn" data-id="${note.noteId}" data-content="${note.content}">Edit</button>
                                <button class="btn btn-danger btn-sm deleteBtn" data-id="${note.noteId}">Delete</button>
                            </div>
                        </div>
                    `;
                    notesContainer.appendChild(noteElement);
                });
            } else {
                notesContainer.innerHTML = '<p class="text-muted">Your saved ideas will appear here.</p>';
            }
        } catch (error) {
            console.error('Failed to load notes:', error);
        }
    });

    // Event listener for the idea form submission (Save a note)
    ideaForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        let noteId = noteIdInput.value;
        let content = contentInput.value;
        let method = noteId ? 'PUT' : 'POST';
        let url = noteId ? `${baseURL}/${noteId}` : baseURL;

        try {
            let response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId, content: content })
            });
            let result = await response.json();

            if (response.ok) {
                alert(noteId ? 'Note updated successfully.' : 'Note created successfully.');
                ideaForm.reset(); // Reset form fields
                noteIdInput.value = ''; // Clear noteId input
                document.dispatchEvent(new Event('DOMContentLoaded')); // Reload notes
            } else {
                console.error('Save error:', result);
                alert(result.error || 'Failed to save the note');
            }
        } catch (error) {
            console.error('Error saving note:', error);
        }
    });

    // Edit button event (Edit a note)
    notesContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('editBtn')) {
            let noteId = event.target.getAttribute('data-id');
            let content = event.target.getAttribute('data-content');

            noteIdInput.value = noteId; // Set noteId in the input
            contentInput.value = content; // Set content in the input
            new bootstrap.Modal(document.getElementById('ideaModal')).show(); // Open modal
        }
    });


    // Delete button event (Delete a note)
    notesContainer.addEventListener('click', async (event) => {
        if (event.target.classList.contains('deleteBtn')) {
            let noteId = event.target.getAttribute('data-id');

            try {
                let response = await fetch(`${baseURL}/${noteId}`, { method: 'DELETE' });
                let result = await response.json();

                if (response.ok) {
                    alert('Note deleted successfully.');
                    document.dispatchEvent(new Event('DOMContentLoaded')); // Reload notes
                } else {
                    console.error('Delete error:', result);
                    alert(result.error || 'Failed to delete the note');
                }
            } catch (error) {
                console.error('Error deleting note:', error);
            }
        }
    });

    // Log out button event (Log out user)
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('userId'); // Clear the user ID from session storage
        window.location.href = '/pages/public/login.html'; // Redirect to the login page
    });
} else {
    // Redirect if no user is logged in
    window.location.href = '/pages/public/login.html';
}
