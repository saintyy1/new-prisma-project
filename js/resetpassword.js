let resetPasswordForm = document.querySelector('.resetPasswordForm');
resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let newPassword = document.querySelector('#newPassword').value;
    let confirmPassword = document.querySelector('#confirmPassword').value;
    let email = sessionStorage.getItem('resetEmail'); // Retrieve email from session storage

    let resetMessage = document.querySelector('.resetMessage');

    if (newPassword !== confirmPassword) {
        resetMessage.textContent = 'Passwords do not match.';
        resetMessage.style.color = "red";
        return;
    }

    try {
        let response = await fetch('http://localhost:8000/api/auth/reset-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, newPassword })
        });

        if (response.ok) {
            resetMessage.textContent = 'Password reset successfully. Redirecting...';
            resetMessage.style.color = "green";
            // Optionally redirect after a short delay
            setTimeout(() => {
                window.location.href = '/pages/public/login.html'; // Redirect to the login page
            }, 2000);
        } else {
            let errorData = await response.json();
            throw new Error(errorData.message || 'Password reset failed');
        }
    } catch (error) {
        console.error('Error:', error);
        resetMessage.textContent = 'Something went wrong: ' + error.message;
        resetMessage.style.color = "red";
    }
});
