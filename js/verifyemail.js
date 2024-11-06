let verifyBtn = document.querySelector('#verifyBtn');
let verificationMessage = document.querySelector('#verificationMessage');

verifyBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    let verificationCode = document.querySelector('#code').value;

    // Show the spinner before the Password Reset process starts
    verifyBtn.classList.add('loading');  // Add the loading class to show spinner

    try {
        let response = await fetch('http://localhost:8000/api/auth/verify-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ verificationCode }) // Send code as an object
        });
        
        if (response.ok) { // Check if the response is OK
            let data = await response.json();
            verificationMessage.innerText = data.message;
            verificationMessage.style.color = "green";

            // Redirect to Login page after a short delay
            setTimeout(() => {
                window.location.href = '/pages/public/login.html';
            }, 2000);
        } else {
            let errorData = await response.json();
            throw new Error(errorData.message || 'Reset password failed');
        }
    } catch (error) {
        console.error('Error:', error);
        verificationMessage.innerText = error.message;
        verificationMessage.style.color = "red";
    } finally {
        verifyBtn.classList.remove('loading');  // Remove the loading class in case of error
    };
});
