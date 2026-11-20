// Starts the Express server for the end-to-end tests on a separate SQLite
// file filled with the seed data, so the tests never touch server/data/app.db.
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '.data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'e2e.db');
fs.rmSync(dbPath, { force: true });

process.env.DB_PATH = dbPath;
process.env.PORT = process.env.PORT || '3001';

require('../server/seed');
require('../server/index');
