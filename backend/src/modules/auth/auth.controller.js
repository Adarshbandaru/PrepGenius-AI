const jwt = require('jsonwebtoken')
const User = require('../../models/User')

const signTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  )
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )
  return { accessToken, refreshToken }
}

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

// POST /api/v1/auth/register
exports.register = async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' })
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
  }

  const existing = await User.findOne({ email })
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered' })
  }

  const user = await User.create({ name, email, password })
  const { accessToken, refreshToken } = signTokens(user._id)

  // Store refresh token
  await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } })
  setRefreshCookie(res, refreshToken)

  res.status(201).json({ success: true, accessToken, user })
}

// POST /api/v1/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' })
  }

  const user = await User.findOne({ email }).select('+password +refreshTokens')
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  const { accessToken, refreshToken } = signTokens(user._id)
  await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } })
  setRefreshCookie(res, refreshToken)

  // Don't send password in response
  const userObj = user.toObject()
  delete userObj.password
  delete userObj.refreshTokens

  res.json({ success: true, accessToken, user: userObj })
}

// POST /api/v1/auth/refresh
exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken
  if (!token) {
    return res.status(401).json({ success: false, message: 'Refresh token required' })
  }

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' })
  }

  const user = await User.findById(decoded.userId).select('+refreshTokens')
  if (!user || !user.refreshTokens?.includes(token)) {
    return res.status(401).json({ success: false, message: 'Refresh token not recognized' })
  }

  // Rotate tokens
  const { accessToken, refreshToken: newRefresh } = signTokens(user._id)
  await User.findByIdAndUpdate(user._id, {
    $pull: { refreshTokens: token },
    $push: { refreshTokens: newRefresh },
  })
  setRefreshCookie(res, newRefresh)

  res.json({ success: true, accessToken })
}

// POST /api/v1/auth/logout
exports.logout = async (req, res) => {
  const token = req.cookies?.refreshToken
  if (token && req.user) {
    await User.findByIdAndUpdate(req.user._id, { $pull: { refreshTokens: token } })
  }
  res.clearCookie('refreshToken')
  res.json({ success: true, message: 'Logged out successfully' })
}

// GET /api/v1/auth/me
exports.me = (req, res) => {
  res.json({ success: true, user: req.user })
}
