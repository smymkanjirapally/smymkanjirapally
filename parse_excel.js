const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('assets/Book1.xlsx');

function extractFile(buf, name) {
    let pos = 0;
    while (pos < buf.length - 4) {
        if (buf[pos] === 0x50 && buf[pos+1] === 0x4B && buf[pos+2] === 0x03 && buf[pos+3] === 0x04) {
            const fnLen = buf.readUInt16LE(pos + 26);
            const extraLen = buf.readUInt16LE(pos + 28);
            const compSize = buf.readUInt32LE(pos + 18);
            const fname = buf.toString('utf8', pos + 30, pos + 30 + fnLen);
            const dataStart = pos + 30 + fnLen + extraLen;
            if (fname === name) {
                return zlib.inflateRawSync(buf.slice(dataStart, dataStart + compSize)).toString('utf8');
            }
            pos = dataStart + compSize;
        } else {
            pos++;
        }
    }
    return null;
}

const ss = extractFile(buf, 'xl/sharedStrings.xml');
const sheet = extractFile(buf, 'xl/worksheets/sheet1.xml');

// Parse shared strings
const strings = [];
const siRe = /<si>([\s\S]*?)<\/si>/g;
let siM;
while ((siM = siRe.exec(ss)) !== null) {
    const tRe = /<t[^>]*>([^<]*)<\/t>/g;
    let tM;
    let text = '';
    while ((tM = tRe.exec(siM[1])) !== null) text += tM[1];
    strings.push(text);
}

// Parse sheet rows
const rows = [];
const rowRe = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
let rm;
while ((rm = rowRe.exec(sheet)) !== null) {
    const rowNum = parseInt(rm[1]);
    const rowContent = rm[2];
    const cells = {};

    const cellRe = /<c r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g;
    let cm;
    while ((cm = cellRe.exec(rowContent)) !== null) {
        const col = cm[1];
        const attrs = cm[2];
        const inner = cm[3];
        const vM = inner.match(/<v>(\d+)<\/v>/);
        if (!vM) continue;
        const val = vM[1];
        if (attrs.indexOf('t="s"') !== -1) {
            cells[col] = strings[parseInt(val)];
        } else {
            const serial = parseInt(val);
            if (serial > 40000) {
                const date = new Date((serial - 25569) * 86400 * 1000);
                const y = date.getUTCFullYear();
                const mo = String(date.getUTCMonth() + 1).padStart(2,'0');
                const d = String(date.getUTCDate()).padStart(2,'0');
                cells[col] = y + '-' + mo + '-' + d;
            } else {
                cells[col] = val;
            }
        }
    }
    if (cells['A'] || cells['B']) {
        rows.push({ row: rowNum, A: cells['A'] || '', B: cells['B'] || '' });
    }
}

// Build events
const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
const events = [];
for (const r of rows) {
    const aVal = (r.A || '').trim();
    const bVal = (r.B || '').trim();
    if (!bVal || MONTHS.includes(aVal.toUpperCase()) || aVal === 'DATE' || aVal === 'PROGRAMS') continue;
    events.push({ date: aVal, name: bVal });
}

// Ensure data dir exists
if (!fs.existsSync('data')) fs.mkdirSync('data');
fs.writeFileSync('data/events.json', JSON.stringify(events, null, 2));
console.log('Written', events.length, 'events to data/events.json');
console.log(JSON.stringify(events.slice(0, 10), null, 2));
