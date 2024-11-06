document.addEventListener("DOMContentLoaded", () => {
    // Extract token and email from URL
    let urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('token');
    let email = urlParams.get('email');

    let verificationMessage = document.querySelector('#verificationMessage');

    // Verify token function
    async function verifyToken() {
        try {
            let response = await fetch('http://localhost:8000/api/auth/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, email })
            });

            if (response.ok) {
                verificationMessage.textContent = "Reset link verified. Redirecting...";
                verificationMessage.style.color = "green";

                // After successful verification
                sessionStorage.setItem('resetEmail', email); // Store the email in session storage

                // Redirect to reset password page after 2 seconds
                setTimeout(() => {
                    window.location.href = '/pages/public/reset-password.html';
                }, 2000);
            } else {
                let errorData = await response.json();
                throw new Error(errorData.message || 'Verification failed');
            }
        } catch (error) {
            verificationMessage.textContent = error.message;
            verificationMessage.style.color = "red";
        }
    }

    verifyToken();
});
