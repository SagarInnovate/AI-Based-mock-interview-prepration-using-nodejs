document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
  
    if (!token) {
      alert('You need to log in first!');
      window.location.href = 'login.html';
    }
  });
  