// Address parsing used by every enrichment pass. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanStreet, expandHouseNumbers, extractStreet, normalisePostcode, parseLRAddress, postcodeKey } from './address.js';

const parsed = (houseNums, street) => ({ houseNums, street });

test('postcodes: lookup key drops spaces, stored form keeps the inner space', () => {
  assert.equal(postcodeKey(' bs9 3aa '), 'BS93AA');
  assert.equal(normalisePostcode(' bs9 3aa '), 'BS9 3AA');
  assert.equal(postcodeKey(null), '');
});

test('street keys: abbreviations expanded, Saint distinguished from Street, punctuation removed', () => {
  assert.equal(cleanStreet('High St'), 'high street');
  assert.equal(cleanStreet('Kings Cres.'), 'kings crescent');
  assert.equal(cleanStreet('St Pauls Rd'), 'saint pauls road');
  assert.equal(cleanStreet('St. Mary Road'), 'saint mary road');
  assert.equal(cleanStreet('St Something Road'), 'street something road', 'unknown saint names stay as written');
  assert.equal(cleanStreet("Queen's Gate"), 'queen s gate', 'apostrophes become spaces on both sides of a match');
});

test('house numbers: singles, ranges on one side of the street, and lists', () => {
  assert.deepEqual(expandHouseNumbers('12A'), ['12a']);
  assert.deepEqual(expandHouseNumbers('10-14'), ['10', '12', '14'], 'same parity: one side of the street');
  assert.deepEqual(expandHouseNumbers('10 to 13'), ['10', '11', '12', '13'], 'mixed parity: every number');
  assert.deepEqual(expandHouseNumbers('3/5'), ['3', '5']);
  assert.deepEqual(expandHouseNumbers('16, 18 and 20'), ['16', '18', '20']);
  assert.deepEqual(expandHouseNumbers('7 & 9'), ['7', '9']);
  assert.deepEqual(expandHouseNumbers('100-180'), ['100', '180'], 'implausibly long ranges keep only their ends');
  assert.deepEqual(expandHouseNumbers('14-10'), ['14', '10'], 'reversed ranges keep their ends');
  assert.deepEqual(expandHouseNumbers(''), []);
});

test('Land Registry addresses: number and street, ignoring flats, floors and land descriptions', () => {
  const cases = {
    '10 Downing Street, London (SW1A 2AA)': parsed(['10'], 'downing street'),
    'Flat 3, 12 High St, Bristol (BS1 4DJ)': parsed(['12'], 'high street'),
    'Unit 4, 2 Station Approach': parsed(['2'], 'station approach'),
    'Ground Floor, 22 Queen Square, Bristol': parsed(['22'], 'queen square'),
    'Land at the rear of 5 Mill Lane, Bristol': parsed(['5'], 'mill lane'),
    '10-14 High Street, Bath': parsed(['10', '12', '14'], 'high street'),
    '12A Kings Cres': parsed(['12a'], 'kings crescent'),
    '1 St Pauls Road, London': parsed(['1'], 'saint pauls road'),
    '1 The Green, Richmond': parsed(['1'], 'the green'),
    '2 Hill Rise and 4 Park View': parsed(['2'], 'hill rise'),
  };
  for (const [address, expected] of Object.entries(cases)) assert.deepEqual(parseLRAddress(address), expected, address);
});

test('streets run to their last street-type word ("Grove Mews", "Green Lane")', () => {
  assert.equal(parseLRAddress('3 Westbourne Grove Mews').street, 'westbourne grove mews');
  assert.equal(parseLRAddress('5 Westbourne Park Road').street, 'westbourne park road');
  assert.equal(parseLRAddress('25 Green Lane, London').street, 'green lane');
  assert.equal(parseLRAddress('1 Bank End').street, 'bank end');
});

test('"Part of" addresses are parsed rather than discarded', () => {
  assert.deepEqual(parseLRAddress('Part of 2-4 Queens Gate, London (SW1A 1AA)'), parsed(['2', '4'], 'queens gate'));
  assert.deepEqual(parseLRAddress('Part of Ground Floor, 12 High St, Bath'), parsed(['12'], 'high street'));
});

test('addresses with full stops and number lists keep every number', () => {
  assert.deepEqual(parseLRAddress('Flat 3, 16, 18 and 20 St. Mary Road'), parsed(['16', '18', '20'], 'saint mary road'));
});

test('addresses with no house number give nothing to match on', () => {
  assert.deepEqual(parseLRAddress('The Old Rectory, Church Road, Bristol'), parsed([], null));
  assert.deepEqual(parseLRAddress('Unit 3 Trading Estate, Avonmouth'), parsed([], null));
  assert.deepEqual(parseLRAddress(''), parsed([], null));
});

test('street extraction finds the street, not the first street-type word', () => {
  const cases = {
    '1 St Pauls Road, London': 'saint pauls road', // was "street": every St … street collided
    '4 St Mary Street, Cardiff': 'saint mary street',
    '25 Green Lane, London': 'green lane', // was "green"
    '1 Bank End, London': 'bank end', // was "bank"
    'Apartment 5, 1-3 Wharf Side, London': 'wharf side', // was "wharf"
    'Land on the east side of Station Road': 'station road', // was "land on the east side"
    'Part of St. Mary Road, Manchester': 'saint mary road', // was "part of street"
    'The Old Rectory, Church Road, Bristol': 'church road',
    '3 Westbourne Grove Mews': 'westbourne grove mews',
  };
  for (const [address, expected] of Object.entries(cases)) assert.equal(extractStreet(address), expected, address);
});

test('street extraction returns null rather than a wrong street', () => {
  assert.equal(extractStreet('Land and buildings on the north side of 4 Parkside'), null, 'was "land and buildings"');
  assert.equal(extractStreet('Unit 3 Trading Estate, Avonmouth'), null);
  assert.equal(extractStreet('London'), null);
});
