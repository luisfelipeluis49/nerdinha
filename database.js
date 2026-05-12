const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'characters.db');
const db = new sqlite3.Database(dbPath);

function initDb() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT UNIQUE,
            minecraftNick TEXT,
            charName TEXT,
            kingdom TEXT,
            origin TEXT,
            function TEXT,
            lore TEXT,
            skills TEXT,
            status TEXT DEFAULT 'PENDING'
        )`);
    });
}

module.exports = {
    db,
    initDb
};
