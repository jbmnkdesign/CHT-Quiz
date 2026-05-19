const fs = require('fs');
const path = require('path');
const { seedQuestions } = require('./seedData');

const USE_KV = !!process.env.KV_REST_API_URL;
const DATA_DIR = path.join(__dirname, '../data');

const DEFAULTS = {
  questions: seedQuestions,
  results: []
};

let kv = null;
if (USE_KV) {
  kv = require('@vercel/kv').kv;
}

async function read(key) {
  if (USE_KV) {
    let value = await kv.get(key);
    if (value === null || value === undefined) {
      value = DEFAULTS[key] ?? [];
      await kv.set(key, value);
    }
    return value;
  }

  const filePath = path.join(DATA_DIR, key + '.json');
  if (!fs.existsSync(filePath)) {
    return DEFAULTS[key] ?? [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return DEFAULTS[key] ?? [];
  }
}

async function write(key, data) {
  if (USE_KV) {
    await kv.set(key, data);
    return;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(
    path.join(DATA_DIR, key + '.json'),
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

module.exports = { read, write };
