const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await apiFetch('/api/student/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store token and redirect to dashboard
    localStorage.setItem('token', response.token);
    alert('Login successful!');
    window.location.href = 'dashboard.html';
  } catch (error) {
    alert(error.message);
  }
});
