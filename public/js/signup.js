const signupForm = document.getElementById('signup-form');

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await apiFetch('/api/student/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    alert('Signup successful! Please login.');
    window.location.href = 'login.html';
  } catch (error) {
    alert(error.message);
  }
});
