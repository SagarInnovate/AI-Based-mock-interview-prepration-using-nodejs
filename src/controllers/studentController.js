const Student = require('../models/studentModel');
const bcrypt = require('bcryptjs');




const getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.session.studentId);

    if (!student) {
      return res.render('student/profile', { error: 'Student not found' });
    }

    const jobOptions = ['Software Engineer', 'Data Scientist', 'Product Manager', 'Designer'];

    res.render('student/profile', {
      name: student.name,
      email: student.email,
      jobPositions: student.jobPositions || [],
      profilePhoto: student.profilePhoto || '/default-profile.png',
      jobOptions,
      error: null,
      success: null
    });
  } catch (error) {
    res.render('student/profile', { error: 'An error occurred', success: null });
  }
};


const updateProfile = async (req, res) => {
  try {
    const { name, email, jobPositions } = req.body;

    const student = await Student.findByIdAndUpdate(
      req.session.studentId,
      {
        name,
        email,
        jobPositions: Array.isArray(jobPositions) ? jobPositions : [jobPositions]
      },
      { new: true }
    );

    if (!student) {
      return res.render('student/profile', { error: 'Student not found', success: null });
    }

    const jobOptions = ['Software Engineer', 'Data Scientist', 'Product Manager', 'Designer'];
    res.render('student/profile', {
      name: student.name,
      email: student.email,
      jobPositions: student.jobPositions || [],
      profilePhoto: student.profilePhoto || '/default-profile.png',
      jobOptions,
      error: null,
      success: 'Profile updated successfully!'
    });
  } catch (error) {
    res.render('student/profile', { error: 'Failed to update profile', success: null });
  }
};


// Render the change password form
const changePasswordView = (req, res) => {
  res.render('student/auth/change-password', { error: null });
};

// Handle changing the password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Ensure all fields are provided
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.render('student/auth/change-password', {
        error: 'All fields are required',
      });
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.render('student/auth/change-password', {
        error: 'New passwords do not match',
      });
    }

    // Find the student based on session data
    const student = await Student.findById(req.session.studentId);

    if (!student) {
      return res.render('student/auth/change-password', {
        error: 'Student not found',
      });
    }

    // Verify old password
    const isMatch = await student.matchPassword(oldPassword);
    if (!isMatch) {
      return res.render('student/auth/change-password', {
        error: 'Old password is incorrect',
      });
    }

    // Update password
    student.password = newPassword;
    await student.save();

    res.redirect('/dashboard'); // Redirect to the dashboard after password change
  } catch (error) {
    res.status(500).render('student/auth/change-password', { error: 'Server error' });
  }
};




module.exports = { getProfile, changePasswordView, changePassword ,updateProfile};
