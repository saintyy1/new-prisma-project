let signUpForm = document.querySelector('.signupForm');
let signUpBtn = document.querySelector('#signUpBtn');
let verificationMessage = document.querySelector('#verificationMessage');

signUpBtn.addEventListener('click', async (e) => {
    e.preventDefault();

  let userData = {
        F_name: document.querySelector('#firstName').value,
        L_name: document.querySelector('#lastName').value,
        gender: document.querySelector('#gender').value,
        email: document.querySelector('#email').value,
        password: document.querySelector('#password').value,
    };
    
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (userData.password.length < 7) {
        verificationMessage.innerText = 'Password not strong enough';
        verificationMessage.style.color = "red";
        return
    }

    if (userData.F_name.trim().length < 2) {
        verificationMessage.innerText = 'First name is not valid';
        verificationMessage.style.color = "red";
        return
    }

    if (userData.L_name.trim().length < 2) {
        verificationMessage.innerText = 'Last name is not valid';
        verificationMessage.style.color = "red";
        return
    }

    if (!emailRegex.test(userData.email.trim())) {
        verificationMessage.innerText = 'Email is not valid';
        verificationMessage.style.color = "red";
        return
    }

    // Show the spinner before the sign-up process starts
    signUpBtn.classList.add('loading');  // Add the loading class to show spinner

    try {
        // Send sign-up data to the backend
        let response = await fetch('http://localhost:8000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            let data = await response.json();
            verificationMessage.innerText = data.message;
            verificationMessage.style.color = "green";

            // Redirect to verify email page after a short delay
            setTimeout(() => {
                window.location.href = '/pages/public/verifyemail.html';
            }, 2000);
        } else {
            let errorData = await response.json();
            throw new Error(errorData.message || 'Sign-up failed');
        }
    } catch (error) {
        verificationMessage.innerText = error.message;
        verificationMessage.style.color = "red";
    } finally {
        // Always remove the loading state, even in case of an error
        signUpBtn.classList.remove('loading');  // Hide the spinner
    };
});
