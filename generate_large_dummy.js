const XLSX = require('xlsx');
const fs = require('fs');

const NAMES = ["김철수", "이영희", " 박민수", "최지우 ", " 정수빈", "강하늘", "조민재", "윤서연", " 장미 ", "오지호"];
const CITIES = ["서울시", "부산광역시", "대구", "인천", "광주광역시", "대전", "울산", "세종시", "경기도"];
const DISTRICTS = ["강남구", "해운대구", "수성구", "남구", "북구", "서구", "중구", "동구"];
const STREETS = ["테헤란로", "해운대로", "달구벌대로", "중앙대로", "가무내로", "벚꽃로"];
const STATUSES = ["Active", "Inactive", "휴면", "정지", "탈퇴", "pending"];
const BROKEN_CHARS = ["Ã¦", "Ã¸", "Ã¥", "ï¿½", "ë°", "ì´", "ðŸ˜€", "&nbsp;", "null", "undefined", "NaN"];
const GARBAGE = ["---", "???", "!", "X", "unknown", "N/A"];

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick(arr) {
    return arr[randomInt(0, arr.length - 1)];
}

function generatePhone() {
    const p1 = "010";
    const p2 = randomInt(1000, 9999);
    const p3 = randomInt(1000, 9999);
    const format = randomInt(0, 4);
    if (format === 0) return `${p1}${p2}${p3}`;
    if (format === 1) return `${p1}-${p2}-${p3}`;
    if (format === 2) return `${p1} ${p2} ${p3}`;
    if (format === 3) return `${p1}.${p2}.${p3}`;
    return `${p1}-${p2}${p3}`;
}

function generateDate() {
    const y = randomInt(2020, 2023);
    const m = String(randomInt(1, 12)).padStart(2, '0');
    const d = String(randomInt(1, 28)).padStart(2, '0');
    const format = randomInt(0, 3);
    if (format === 0) return `${y}-${m}-${d}`;
    if (format === 1) return `${y}${m}${d}`;
    if (format === 2) return `${y}.${m}.${d}`;
    return `${y}/${m}/${d}`;
}

function generateZipCode() {
    const code = randomInt(100, 99999);
    const codeStr = String(code).padStart(5, '0');
    const format = randomInt(0, 3);
    if (format === 1) return ` ${codeStr} `;
    if (format === 2) return codeStr.substring(0, 5);
    if (format === 3) return String(randomInt(1000, 9999));
    return codeStr;
}

function addChaos(val) {
    const r = Math.random();
    if (r > 0.95) return randomPick(BROKEN_CHARS) + val;
    if (r > 0.9) return randomPick(GARBAGE);
    if (r > 0.85) return "";
    return val;
}

const data = [];

for (let i = 1; i <= 200; i++) {
    // 1. Name Chaos
    let name = randomPick(NAMES);
    if (Math.random() > 0.8) name = addChaos(name);
    if (Math.random() > 0.95) name = String(randomInt(1000, 9999));

    // 2. Phone Chaos
    let phone = generatePhone();
    if (Math.random() > 0.9) phone = "010-ABCD-EFGH";
    if (Math.random() > 0.95) phone = addChaos(phone);

    // 3. Zip Chaos
    let zip = generateZipCode();
    if (Math.random() > 0.9) zip = "None";
    if (Math.random() > 0.95) zip = "123-456";

    // 4. Date Chaos
    let date = generateDate();
    if (Math.random() > 0.9) date = "어제";
    if (Math.random() > 0.95) date = "2023.13.45";

    // 5. Email Chaos
    let email = `user${i}@example.com`;
    if (Math.random() > 0.9) email = "user" + i + "at_gmail_dot_com";
    if (Math.random() > 0.95) email = " ";

    data.push({
        "ID": i,
        "고객명": name,
        "연락처": phone,
        "우편번호": zip,
        "가입일자": date,
        "배송지 주소": addChaos(randomPick(CITIES) + " " + randomPick(DISTRICTS)),
        "구매금액": Math.random() > 0.9 ? "만원" : randomInt(100, 100000),
        "이메일": email,
        "상태": randomPick(STATUSES),
        "메모": addChaos("")
    });
}

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "ChaosData");
XLSX.writeFile(workbook, "chaos_test_data.xlsx");

const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
fs.writeFileSync('chaos_test_data.csv', csvOutput);

console.log("Generated 'chaos_test_data.xlsx' and 'chaos_test_data.csv' with 200 rows of CHAOS.");
