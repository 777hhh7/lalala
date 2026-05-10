const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Load data
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return { scores: [] };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data), 'utf8');
}

// Middleware
app.use(express.json());

// Serve static files (the game)
app.use(express.static(path.join(__dirname, 'public')));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// GET /api/leaderboard - top scores
app.get('/api/leaderboard', (req, res) => {
  const data = loadData();
  const top = data.scores.sort((a, b) => b.score - a.score).slice(0, 100);
  res.json({ success: true, data: top, total: data.scores.length });
});

// POST /api/score - submit a score
app.post('/api/score', (req, res) => {
  const { name, score, level } = req.body;
  if (!name || score == null) {
    return res.status(400).json({ success: false, error: 'Missing name or score' });
  }
  const data = loadData();
  const record = {
    name: String(name).slice(0, 10),
    score: Math.round(Number(score)),
    level: Math.round(Number(level)) || 1,
    date: Date.now(),
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
  };
  data.scores.push(record);
  data.scores.sort((a, b) => b.score - a.score);
  // Keep top 1000
  if (data.scores.length > 1000) data.scores.length = 1000;
  saveData(data);

  // Calculate rank
  const rank = data.scores.findIndex(s => s.id === record.id) + 1;
  res.json({ success: true, rank, id: record.id });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
