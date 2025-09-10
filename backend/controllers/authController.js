const db = require('../database/connection');
const { generateToken, hashPassword, comparePassword } = require('../middleware/auth');
const Joi = require('joi');

// Validation schemas
const passengerRegisterSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  full_name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().min(0).max(20).allow('').optional(),
  date_of_birth: Joi.date().allow('').optional(),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional()
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const adminCreateSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  full_name: Joi.string().min(2).max(100).required(),
  employee_id: Joi.string().max(20).optional(),
  role: Joi.string().valid('ADMIN', 'SUPER_ADMIN', 'OPERATOR').default('ADMIN')
});

// Register new passenger
const registerPassenger = async (req, res) => {
  try {
    // Validate input
    const { error, value } = passengerRegisterSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const { username, email, password, full_name, phone, date_of_birth, gender } = value;

    // Check if username or email already exists
    const checkUserSql = `
      SELECT COUNT(*) as count FROM Passengers 
      WHERE username = :username OR email = :email
    `;
    const checkResult = await db.executeQuery(checkUserSql, [username, email]);

    if (checkResult.rows[0].COUNT > 0) {
      return res.status(409).json({
        success: false,
        error: 'Username or email already exists'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert new passenger
    const insertSql = `
      INSERT INTO Passengers (
        passenger_id, username, email, password_hash, full_name, phone, date_of_birth, gender
      ) VALUES (
        passenger_seq.NEXTVAL, :username, :email, :password_hash, :full_name, :phone, :date_of_birth, :gender
      ) RETURNING passenger_id INTO :passenger_id
    `;

    const binds = {
      username,
      email,
      password_hash: passwordHash,
      full_name,
      phone: phone || null,
      date_of_birth: date_of_birth && date_of_birth !== '' ? new Date(date_of_birth) : null,
      gender: gender || null,
      passenger_id: { dir: db.BIND_OUT, type: db.NUMBER }
    };

    const result = await db.executeQuery(insertSql, binds);
    const passengerId = result.outBinds.passenger_id[0];

    // Generate token
    const token = generateToken({
      userId: passengerId,
      username,
      userType: 'passenger'
    });

    res.status(201).json({
      success: true,
      message: 'Passenger registered successfully',
      data: {
        passenger_id: passengerId,
        username,
        email,
        full_name,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
};

// Passenger login
const loginPassenger = async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const { username, password } = value;

    // Find passenger
    const findSql = `
      SELECT passenger_id, username, email, password_hash, full_name, status
      FROM Passengers 
      WHERE username = :username
    `;
    const result = await db.executeQuery(findSql, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    const passenger = result.rows[0];

    if (passenger.STATUS !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        error: 'Account is not active'
      });
    }

    // Compare password
    const isValidPassword = await comparePassword(password, passenger.PASSWORD_HASH);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Generate token
    const token = generateToken({
      userId: passenger.PASSENGER_ID,
      username: passenger.USERNAME,
      userType: 'passenger'
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        passenger_id: passenger.PASSENGER_ID,
        username: passenger.USERNAME,
        email: passenger.EMAIL,
        full_name: passenger.FULL_NAME,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
};

// Admin login
const loginAdmin = async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const { username, password } = value;

    // Find admin
    const findSql = `
      SELECT admin_id, username, email, password_hash, full_name, role, status
      FROM Admins 
      WHERE username = :username
    `;
    const result = await db.executeQuery(findSql, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    const admin = result.rows[0];

    if (admin.STATUS !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        error: 'Account is not active'
      });
    }

    // Compare password
    const isValidPassword = await comparePassword(password, admin.PASSWORD_HASH);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Generate token
    const token = generateToken({
      userId: admin.ADMIN_ID,
      username: admin.USERNAME,
      userType: 'admin',
      role: admin.ROLE
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin_id: admin.ADMIN_ID,
        username: admin.USERNAME,
        email: admin.EMAIL,
        full_name: admin.FULL_NAME,
        role: admin.ROLE,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
};

// Create new admin (requires admin auth)
const createAdmin = async (req, res) => {
  try {
    // Check if current user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // Validate input
    const { error, value } = adminCreateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details[0].message
      });
    }

    const { username, email, password, full_name, employee_id, role } = value;

    // Check if username or email already exists
    const checkUserSql = `
      SELECT COUNT(*) as count FROM Admins 
      WHERE username = :username OR email = :email
    `;
    const checkResult = await db.executeQuery(checkUserSql, [username, email]);

    if (checkResult.rows[0].COUNT > 0) {
      return res.status(409).json({
        success: false,
        error: 'Username or email already exists'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert new admin
    const insertSql = `
      INSERT INTO Admins (
        admin_id, username, email, password_hash, full_name, employee_id, role, created_by
      ) VALUES (
        admin_seq.NEXTVAL, :username, :email, :password_hash, :full_name, :employee_id, :role, :created_by
      ) RETURNING admin_id INTO :admin_id
    `;

    const binds = {
      username,
      email,
      password_hash: passwordHash,
      full_name,
      employee_id: employee_id || null,
      role,
      created_by: req.user.userId,
      admin_id: { dir: db.BIND_OUT, type: db.NUMBER }
    };

    const result = await db.executeQuery(insertSql, binds);
    const adminId = result.outBinds.admin_id[0];

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        admin_id: adminId,
        username,
        email,
        full_name,
        employee_id,
        role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Admin creation failed',
      details: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const { userId, userType } = req.user;

    let sql, tableName;
    if (userType === 'passenger') {
      sql = `
        SELECT passenger_id as id, username, email, full_name, phone, date_of_birth, gender, status, created_at
        FROM Passengers WHERE passenger_id = :userId
      `;
    } else {
      sql = `
        SELECT admin_id as id, username, email, full_name, employee_id, role, status, created_at
        FROM Admins WHERE admin_id = :userId
      `;
    }

    const result = await db.executeQuery(sql, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        userType
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      details: error.message
    });
  }
};

// Update current user profile
const updateProfile = async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const updateFields = req.body;

    // Remove sensitive fields
    delete updateFields.password;
    delete updateFields.password_hash;
    delete updateFields.username;

    if (userType === 'passenger') {
      const allowedFields = ['email', 'full_name', 'phone', 'date_of_birth', 'gender'];
      const fieldsToUpdate = Object.keys(updateFields).filter(field =>
        allowedFields.includes(field)
      );

      if (fieldsToUpdate.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      let setClause = [];
      let binds = { passenger_id: userId };

      fieldsToUpdate.forEach(field => {
        if (field === 'date_of_birth') {
          setClause.push(`${field} = TO_DATE(:${field}, 'YYYY-MM-DD')`);
        } else {
          setClause.push(`${field} = :${field}`);
        }
        binds[field] = updateFields[field];
      });

      const sql = `
        UPDATE Passengers 
        SET ${setClause.join(', ')}
        WHERE passenger_id = :passenger_id
      `;

      await db.executeQuery(sql, binds);
    } else {
      const allowedFields = ['email', 'full_name', 'employee_id'];
      const fieldsToUpdate = Object.keys(updateFields).filter(field =>
        allowedFields.includes(field)
      );

      if (fieldsToUpdate.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      const setClause = fieldsToUpdate.map(field => `${field} = :${field}`).join(', ');
      const sql = `
        UPDATE Admins 
        SET ${setClause}
        WHERE admin_id = :admin_id
      `;

      const binds = { ...updateFields, admin_id: userId };
      await db.executeQuery(sql, binds);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      details: error.message
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    // Get current password hash
    let sql = userType === 'passenger'
      ? `SELECT password_hash FROM Passengers WHERE passenger_id = :userId`
      : `SELECT password_hash FROM Admins WHERE admin_id = :userId`;

    const result = await db.executeQuery(sql, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, result.rows[0].PASSWORD_HASH);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    sql = userType === 'passenger'
      ? `UPDATE Passengers SET password_hash = :password_hash WHERE passenger_id = :userId`
      : `UPDATE Admins SET password_hash = :password_hash WHERE admin_id = :userId`;

    await db.executeQuery(sql, [newPasswordHash, userId]);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      details: error.message
    });
  }
};

// Logout
const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  registerPassenger,
  loginPassenger,
  loginAdmin,
  createAdmin,
  getProfile,
  updateProfile,
  changePassword,
  logout
};
