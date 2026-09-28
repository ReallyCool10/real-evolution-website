import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('server/cadastre.sqlite');

const total = db.prepare('SELECT COUNT(*) as c FROM properties').get();
const withPc = db.prepare("SELECT COUNT(*) as c FROM properties WHERE postcode IS NOT NULL AND postcode != ''").get();
const geocoded = db.prepare("SELECT COUNT(*) as c FROM properties WHERE latitude IS NOT NULL").get();
const samples = db.prepare('SELECT postcode, property_address FROM properties WHERE postcode IS NOT NULL LIMIT 10').all();

console.log('Total properties:', total.c);
console.log('With postcode:', withPc.c);
console.log('Geocoded currently:', geocoded.c);
console.log('Sample postcodes:', samples);
