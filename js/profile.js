let userId = sessionStorage.getItem('userId');
let confirmDeleteBtn = document.querySelector('#confirmDelete');
let logoutBtn = document.querySelector('.logoutBtn');


if (userId) {
    async function fetchUserProfile() {
        try {
            let response = await fetch(`http://localhost:8000/api/users/${userId}`);
            if (!response.ok) {
                throw new Error("Failed to fetch user data");
            }
            let user = await response.json();
    
            // Update the DOM with user data
            document.querySelector("#firstName").textContent = user.F_name;
            document.querySelector("#lastName").textContent = user.L_name;
            document.querySelector("#email").textContent = user.email;
            document.querySelector("#gender").textContent = user.gender;

            // Set gender icon
            let genderIcon = document.querySelector("#genderIcon");
            genderIcon.src = user.gender === "Male" ? "/images/man.png" : "/images/woman.png";
        } catch (error) {
            console.error(error);
            alert("Could not load user profile. Kindly refresh");
        }
    }
    // Call function to fetch and display data
    fetchUserProfile();

    // To delete/disable a user account
    confirmDeleteBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        try {
            // Send delete data to the backend
            let response = await fetch(`http://localhost:8000/api/users/${userId}/delete-account`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: "Disabled" })
            });

            if (response.ok) {
                await response.json();
                let deleteAccountModal = new bootstrap.Modal(document.querySelector('#deleteAccountModal'));
                deleteAccountModal.hide();  // Automatically hides the modal on page load
                alert('Account has been deleted..');

                // Redirect to verify email page after a short delay
                setTimeout(() => {
                    window.location.href = '/pages/public/login.html';
                }, 2000);
            } else {
                let errorData = await response.json();
                throw new Error(errorData.message);
            }
        } catch(error) {
            alert(error.message);
        }
    })

    // Log out button event (Log out user)
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('userId'); // Clear the user ID from session storage
        window.location.href = '/pages/public/login.html'; // Redirect to the login page
    });
} else {
    // Redirect if no user is logged in
    window.location.href = '/pages/public/login.html';
}