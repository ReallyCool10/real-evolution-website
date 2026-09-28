import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('server/cadastre.sqlite');
db.exec('PRAGMA synchronous = OFF; PRAGMA journal_mode = WAL;');

const stmtUpdate = db.prepare('UPDATE properties SET latitude = ?, longitude = ? WHERE id = ?');

const sample = db.prepare('SELECT id, latitude, longitude FROM properties LIMIT 10000').all();

console.log('Testing 10,000 updates in a single transaction...');
const t0 = Date.now();
db.exec('BEGIN TRANSACTION;');
for (const r of sample) {
  stmtUpdate.run(r.latitude, r.longitude, r.id);
}
db.exec('COMMIT;');
console.log(`10,000 updates took ${Date.now() - t0}ms`);
