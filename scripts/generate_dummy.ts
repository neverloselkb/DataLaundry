import * as fs from 'fs';
import * as path from 'path';

// Chaos generators
const names = ['홍길동', '김철수', 'Lee James', '박 민수', '최.영.희', 'Unknown', 'N/A'];
const domains = ['gmail.com', 'naver.com', 'hanmail.net', '', 'com', 'test.co.kr'];
const cities = ['서울', '부산', '대구', 'Incheon', 'Gwangju', 'Daejeon', 'Sejong', 'Jeju'];

function randomDate() {
    const y = 2020 + Math.floor(Math.random() * 5);
    const m = 1 + Math.floor(Math.random() * 12);
    const d = 1 + Math.floor(Math.random() * 28);
    const type = Math.random();
    if (type < 0.3) return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (type < 0.6) return `${y}. ${m}. ${d}`;
    return `${m}/${d}/${y}`; // US style
}

function randomPhone() {
    const type = Math.random();
    const mid = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const last = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    if (type < 0.2) return `010-${mid}-${last}`;
    if (type < 0.4) return `010${mid}${last}`;
    if (type < 0.6) return `010 ${mid} ${last}`;
    if (type < 0.8) return `+82 10-${mid}-${last}`;
    return `Phone: ${mid}-${last}`; // Noise
}

function randomAmount() {
    const val = Math.floor(Math.random() * 1000000);
    const type = Math.random();
    if (type < 0.3) return `${val}`;
    if (type < 0.6) return `${val.toLocaleString()}원`;
    if (type < 0.8) return `${val / 10000}만원`;
    return `약 ${Math.floor(val / 1000)}천원`;
}

function randomName() {
    const base = names[Math.floor(Math.random() * names.length)];
    const noise = Math.random();
    if (noise < 0.2) return `${base}123`;
    if (noise < 0.4) return ` ${base} `;
    if (noise < 0.5) return `${base}!!`;
    return base;
}

function randomEmail() {
    const user = Math.random().toString(36).substring(7);
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const type = Math.random();
    if (type < 0.2) return user; // No domain
    if (type < 0.4) return `${user}@@${domain}`; // Double @
    return `${user}@${domain}`;
}

const HEADER = "Name,Phone,Email,Join Date,Amount,Address,Zip,Note\n";
const ROW_COUNT = 30000;

let csvContent = HEADER;

for (let i = 0; i < ROW_COUNT; i++) {
    const name = randomName();
    const phone = randomPhone();
    const email = randomEmail();
    const date = randomDate();
    const amount = randomAmount();
    const city = cities[Math.floor(Math.random() * cities.length)];
    const zip = Math.random() < 0.5 ? String(Math.floor(Math.random() * 100000)) : String(Math.floor(Math.random() * 999));
    const note = Math.random() < 0.3 ? '---' : Math.random() < 0.5 ? 'NULL' : 'Note';

    csvContent += `${name},${phone},${email},${date},${amount},${city},${zip},${note}\n`;
}

fs.writeFileSync(path.join(__dirname, '../public/chaos_data.csv'), csvContent, 'utf8');
console.log(`Generated ${ROW_COUNT} rows of chaos data at public/chaos_data.csv`);
