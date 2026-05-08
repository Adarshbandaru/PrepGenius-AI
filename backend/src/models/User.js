const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  resume: {
    url: String,
    originalName: String,
    parsed: {
      skills: [String],
      experience: [{
        company: String, role: String, duration: String, description: String,
      }],
      education: [{
        degree: String, institute: String, year: String,
      }],
      projects: [{
        name: String, description: String, tech: [String],
      }],
    },
  },
  refreshTokens: [{ type: String, select: false }],
}, { timestamps: true })

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.refreshTokens
  return obj
}

module.exports = mongoose.model('User', userSchema)
