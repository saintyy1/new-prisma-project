let loginForm = document.querySelector('.loginForm');
let verificationMessage = document.querySelector('#verificationMessage');
let verificationMessageTwo = document.querySelector('#verificationMessageTwo');
let verifyLink = document.querySelector('#verifyNowLink');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let email = document.querySelector('#email').value;
    let password = document.querySelector('#password').value;

    try {
        let response = await fetch('http://localhost:8000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            let result = await response.json();
            let userId = result.user.id;

            // Check if user status is active
            if (result.user.status !== 'Active') {
                verificationMessageTwo.innerHTML = 'Your account has been disabled.';
                verificationMessageTwo.style.color = "red";
                return;
            }

            if (result.user.isVerified) {
                verificationMessageTwo.innerText = 'Login Successful';
                verificationMessageTwo.style.color = "green";
                sessionStorage.setItem('userId', userId);
                setTimeout(() => {
                    window.location.href = '/pages/public/dashboard.html';
                }, 2000);
            } else {
                verificationMessage.style.display = 'block';
                verifyLink.addEventListener('click', async () => {
                    try {
                        let response = await fetch('http://localhost:8000/api/auth/send-verification-code', { method: 'POST', body: JSON.stringify({ email }) });

                        if (response.ok) {
                            let data = await response.json();
                            verificationMessage.innerText = data.message;
                            verificationMessage.style.color = "green";
                            setTimeout(() => {
                                window.location.href = '/pages/public/verifyemail.html';
                            }, 2000);
                        } else {
                            let error = await response.json();
                            verificationMessage.innerText = error.message;
                            verificationMessage.style.color = "red";
                        }
                    } catch (error) {
                        verificationMessage.innerText = error.message;
                        verificationMessage.style.color = "red";
                    }
                });                
            }
        } else {
            let error = await response.json();
            verificationMessage.innerText = error.message;
            verificationMessage.style.color = "red";
        }
    } catch (error) {
        verificationMessage.innerText = error.message;
        verificationMessage.style.color = "red";
    }
});
