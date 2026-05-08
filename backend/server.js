const app = require('./src/app')

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 PrepGenius Backend running on http://localhost:${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
})
