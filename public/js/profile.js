const renderProfile = async () => {
    try {
      const profile = await apiFetch('/api/student/profile');
      document.getElementById('profile-name').textContent = profile.name;
      document.getElementById('profile-email').textContent = profile.email;
      document.getElementById('profile-jobs').textContent = profile.jobPositions.join(', ') || 'None';
      document.getElementById('profile-photo').src = profile.profilePhoto || './default-avatar.png';
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  };
  
  const handleChangePassword = async (event) => {
    event.preventDefault();
  
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
  
    try {
      await apiFetch('/api/student/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      });
      alert('Password changed successfully!');
      document.getElementById('change-password-form').reset();
    } catch (error) {
      alert(error.message);
      console.error(error);
    }
  };
  
  document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);
  
  // Initialize
  renderProfile();
  