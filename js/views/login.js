import { navigate } from '../router.js';

export function renderLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="auth-container">
            <h1>Budget Manager</h1>
            <p>Sign in to manage your finances</p>
            
            <form id="login-form">
                <input type="text" id="login-username" placeholder="Username" required>
                <input type="password" id="login-password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
            
            <div class="auth-links">
                <a href="#" id="go-register">Register</a> | 
                <a href="#" id="go-reset">Forgot Password?</a>
            </div>

            <div class="divider">OR</div>

            <div id="google_btn"></div>

            <!-- Hidden Registration Modal -->
            <div id="registration-modal" class="modal hidden">
                <div class="modal-content">
                    <h2>Complete Registration</h2>
                    <p>Please choose a username for your account.</p>
                    <form id="google-register-form">
                        <input type="text" id="reg-username" placeholder="Username" required>
                        <button type="submit">Continue</button>
                    </form>
                </div>
            </div>
            
            <div id="login-error" class="error"></div>
        </div>
    `;

    // Expose callback globally for Google script
    window.handleCredentialResponse = handleCredentialResponse;

    // Initialize and render Google Sign-In button
    if (window.google && window.google.accounts) {
        google.accounts.id.initialize({
            client_id: "654028522164-pljc1ujdet9gd0b2gm1n64oegt211hnk.apps.googleusercontent.com",
            callback: handleCredentialResponse,
            auto_select: false
        });
        google.accounts.id.renderButton(
            document.getElementById("google_btn"),
            { theme: "outline", size: "large", width: "100%" }  // customization attributes
        );
    } else {
        // Retry if script not loaded yet (simple retry mechanism)
        setTimeout(() => {
            if (window.google && window.google.accounts) {
                google.accounts.id.initialize({
                    client_id: "654028522164-pljc1ujdet9gd0b2gm1n64oegt211hnk.apps.googleusercontent.com",
                    callback: handleCredentialResponse,
                    auto_select: false
                });
                google.accounts.id.renderButton(
                    document.getElementById("google_btn"),
                    { theme: "outline", size: "large", width: "100%" }
                );
            }
        }, 1000);
    }

    document.getElementById('google-register-form').addEventListener('submit', handleRegister);

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch('api/auth.php?action=login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success) {
                window.location.reload();
            } else {
                document.getElementById('login-error').textContent = data.error || 'Login failed';
            }
        } catch (err) {
            console.error(err);
            document.getElementById('login-error').textContent = 'An error occurred';
        }
    });

    document.getElementById('go-register').addEventListener('click', (e) => {
        e.preventDefault();
        renderRegister();
    });

    document.getElementById('go-reset').addEventListener('click', (e) => {
        e.preventDefault();
        renderResetStep1();
    });
}

let tempGoogleToken = null;

async function handleCredentialResponse(response) {
    try {
        const res = await fetch('api/auth.php?action=google_auth', {
            method: 'POST',
            body: JSON.stringify({ token: response.credential })
        });

        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error('Invalid server response: ' + text);
        }

        if (data.status === 'new_user') {
            tempGoogleToken = response.credential;
            document.getElementById('registration-modal').classList.remove('hidden');
        } else if (data.success) {
            // Reload to update session state
            window.location.reload();
        } else {
            document.getElementById('login-error').textContent = data.error || 'Login failed';
        }
    } catch (e) {
        console.error(e);
        document.getElementById('login-error').textContent = 'Error: ' + e.message;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;

    try {
        const res = await fetch('api/auth.php?action=google_register', {
            method: 'POST',
            body: JSON.stringify({
                token: tempGoogleToken,
                username: username
            })
        });
        const data = await res.json();

        if (data.success) {
            window.location.reload();
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (e) {
        console.error(e);
        alert('An error occurred');
    }
}

function renderRegister() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="auth-container">
            <h1>Register</h1>
            <form id="auth-form">
                <input type="text" id="username" placeholder="Username" required>
                <input type="password" id="password" placeholder="Password" required>
                <input type="text" id="question" placeholder="Security Question (e.g. Pet's name)" required>
                <input type="text" id="answer" placeholder="Security Answer" required>
                <button type="submit">Register</button>
            </form>
            <p>Already have an account? <a href="#" id="go-login">Login</a></p>
            <div id="error-msg" class="error"></div>
        </div>
    `;

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const question = document.getElementById('question').value;
        const answer = document.getElementById('answer').value;

        try {
            const res = await fetch('api/auth.php?action=register', {
                method: 'POST',
                body: JSON.stringify({ username, password, security_question: question, security_answer: answer })
            });
            const data = await res.json();
            if (res.ok) {
                navigate('dashboard');
            } else {
                document.getElementById('error-msg').innerText = data.error;
            }
        } catch (err) {
            document.getElementById('error-msg').innerText = 'An error occurred';
        }
    });

    document.getElementById('go-login').addEventListener('click', (e) => {
        e.preventDefault();
        renderLogin();
    });
}

function renderResetStep1() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="auth-container">
            <h1>Reset Password</h1>
            <form id="auth-form">
                <input type="text" id="username" placeholder="Enter your username" required>
                <button type="submit">Next</button>
            </form>
            <p><a href="#" id="go-login">Back to Login</a></p>
            <div id="error-msg" class="error"></div>
        </div>
    `;

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;

        try {
            const res = await fetch(`api/auth.php?action=get_security_question&username=${username}`);
            const data = await res.json();
            if (res.ok) {
                renderResetStep2(username, data.question);
            } else {
                document.getElementById('error-msg').innerText = data.error;
            }
        } catch (err) {
            document.getElementById('error-msg').innerText = 'An error occurred';
        }
    });

    document.getElementById('go-login').addEventListener('click', (e) => {
        e.preventDefault();
        renderLogin();
    });
}

function renderResetStep2(username, question) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="auth-container">
            <h1>Reset Password</h1>
            <p>Security Question: <strong>${question}</strong></p>
            <form id="auth-form">
                <input type="text" id="answer" placeholder="Security Answer" required>
                <input type="password" id="new-password" placeholder="New Password" required>
                <button type="submit">Reset Password</button>
            </form>
            <div id="error-msg" class="error"></div>
        </div>
    `;

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const answer = document.getElementById('answer').value;
        const newPassword = document.getElementById('new-password').value;

        try {
            const res = await fetch('api/auth.php?action=reset_password', {
                method: 'POST',
                body: JSON.stringify({ username, security_answer: answer, new_password: newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Password reset successful. Please login.');
                renderLogin();
            } else {
                document.getElementById('error-msg').innerText = data.error;
            }
        } catch (err) {
            document.getElementById('error-msg').innerText = 'An error occurred';
        }
    });
}
