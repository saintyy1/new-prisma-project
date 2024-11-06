let resetBtn = document.querySelector('#resetBtn');
let verificationMessage = document.querySelector('#verificationMessage');

resetBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    let email = document.querySelector('#email').value;

    // Show the spinner before the Password Reset process starts
    resetBtn.classList.add('loading');  // Add the loading class to show spinner

    try {
        let response = await fetch('http://localhost:8000/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email }) // Send email as an object
        });

        if (response.ok) { // Check if the response is OK
            let result = await response.json();
            verificationMessage.style.display = 'block';
        } else {
            let errorData = await response.json();
            throw new Error(errorData.message || 'Reset password failed');
        }
    } catch (error) {
        console.error('Error:', error);
        verificationMessage.textContent = error.message;
        verificationMessage.style.display = 'red';
    } finally {
        resetBtn.classList.remove('loading');  // Remove the loading class in case of error
    };
});
