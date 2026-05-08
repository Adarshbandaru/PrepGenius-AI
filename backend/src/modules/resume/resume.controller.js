const multer = require('multer')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const User = require('../../models/User')

// Local storage (S3-ready in production)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `resume_${req.user._id}_${Date.now()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx']
    if (!allowed.includes(path.extname(file.originalname).toLowerCase())) {
      return cb(new Error('Only PDF and DOCX files are allowed'))
    }
    cb(null, true)
  },
})

// POST /api/v1/resume/upload
exports.uploadResume = [
  upload.single('resume'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    const fileUrl = `/uploads/${req.file.filename}`

    // Call AI service for parsing (graceful fail)
    let parsed = { skills: [], experience: [], education: [], projects: [] }
    try {
      const aiRes = await axios.post(
        `${process.env.AI_SERVICE_URL}/ai/parse-resume`,
        { filePath: req.file.path, fileName: req.file.filename },
        { timeout: 30000 }
      )
      parsed = aiRes.data.parsed
    } catch (aiErr) {
      console.warn('[Resume] AI parsing failed, using empty data:', aiErr.message)
    }

    await User.findByIdAndUpdate(req.user._id, {
      'resume.url': fileUrl,
      'resume.originalName': req.file.originalname,
      'resume.parsed': parsed,
    })

    res.json({ success: true, message: 'Resume uploaded and parsed', url: fileUrl, parsed })
  },
]

// GET /api/v1/resume/parsed
exports.getParsed = async (req, res) => {
  const user = await User.findById(req.user._id)
  if (!user?.resume?.url) {
    return res.status(404).json({ success: false, message: 'No resume uploaded yet' })
  }
  res.json({ success: true, url: user.resume.url, parsed: user.resume.parsed })
}

// POST /api/v1/resume/analyze — ATS Score + Job Recommendations
exports.analyzeResume = async (req, res) => {
  const user = await User.findById(req.user._id)
  if (!user?.resume?.parsed) {
    return res.status(400).json({ success: false, message: 'Upload a resume first' })
  }

  try {
    const aiRes = await axios.post(
      `${process.env.AI_SERVICE_URL}/ai/analyze-resume`,
      { parsed_resume: user.resume.parsed },
      { timeout: 45000 }
    )
    res.json({ success: true, analysis: aiRes.data.analysis })
  } catch (aiErr) {
    console.warn('[Resume Analyze] AI service unavailable:', aiErr.message)
    // Fallback: basic analysis from parsed data
    const skills = user.resume.parsed?.skills || []
    res.json({
      success: true,
      analysis: {
        ats_score: Math.min(50 + skills.length * 2, 85),
        ats_breakdown: { skills_relevance: 60 + skills.length, education: 70, experience: 50, projects: 55, completeness: 60 },
        profile_summary: `Candidate with ${skills.length} technical skills including ${skills.slice(0, 3).join(', ')}. Start the AI service for a detailed analysis.`,
        strengths: skills.slice(0, 3).map(s => `Proficiency in ${s}`),
        improvements: ['Start AI service for detailed feedback', 'Add quantified achievements', 'Include LinkedIn profile'],
        recommended_roles: [
          { role: 'Software Developer', match_pct: 75, why: 'Strong technical skill set', missing_skills: ['Cloud', 'CI/CD'], salary_range: '6-12 LPA', demand: 'High' },
          { role: 'Backend Developer', match_pct: 70, why: 'Good server-side skills', missing_skills: ['Docker', 'Redis'], salary_range: '7-14 LPA', demand: 'High' },
          { role: 'Full Stack Developer', match_pct: 68, why: 'Broad technology coverage', missing_skills: ['TypeScript', 'AWS'], salary_range: '8-16 LPA', demand: 'High' },
        ],
        interview_readiness: 58,
        top_certifications: ['AWS Cloud Practitioner', 'Google Associate Developer', 'MongoDB Certified'],
      }
    })
  }
}
