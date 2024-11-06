let userId = sessionStorage.getItem('userId');
let logoutBtn = document.querySelector('.logoutBtn');
let changePasswordForm = document.querySelector('#changePasswordForm');
let verificationMessage = document.querySelector('#verificationMessage');

if(userId) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        let oldPassword = document.querySelector('#currentPassword').value;
        let newPassword = document.querySelector('#newPassword').value;
        let confirmPassword = document.querySelector('#confirmPassword').value;

        if(newPassword !== confirmPassword) {
            verificationMessage.innerText = 'Passwords do not match';
            verificationMessage.style.color = "red";
            return
        }

        try {
            // Send sign-up data to the backend
            let response = await fetch(`http://localhost:8000/api/users/${userId}/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            if (response.ok) {
                let data = await response.json();
                verificationMessage.innerText = data.message;
                verificationMessage.style.color = "green";

                // Redirect to verify email page after a short delay
                setTimeout(() => {
                    window.location.href = '/pages/public/login.html';
                }, 2000);
            } else {
                let errorData = await response.json();
                throw new Error(errorData.message);
            }
        } catch(error){
            verificationMessage.innerText = error.message;
            verificationMessage.style.color = "red";
        }
    })

    // Log out button event (Log out user)
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('userId'); // Clear the user ID from session storage
        window.location.href = '/pages/public/login.html'; // Redirect to the login page
    });
} else {
    window.location.href = '/pages/public/login.html'
}