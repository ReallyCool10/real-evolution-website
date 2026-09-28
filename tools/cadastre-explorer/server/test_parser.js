const { parseCsvLine } = require('./csvParser.js');

const sample = '"MAN407885","Leasehold","8 Little David Street, Manchester (M1 3GA)","MANCHESTER","GREATER MANCHESTER","NORTH WEST","M1 3GA","N","","THE GREAT NORTH PIE COMPANY LTD"';
const parsed = parseCsvLine(sample);
console.log('Parsed count:', parsed.length);
console.log('Sample parsed:', parsed.slice(0, 4));
