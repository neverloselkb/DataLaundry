// 테스트 데이터 생성 스크립트 (1500줄)
const fs = require('fs');

const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '전', '홍', '고', '문', '양', '손', '배', '백', '허', '유', '남', '심', '노', '하', '곽', '성', '차', '주', '우', '구', '민', '진', '나', '표', '도', '채', '원', '천', '방', '공', '현'];
const firstNames = ['민준', '서준', '도윤', '예준', '시우', '하준', '주원', '지호', '지후', '준서', '준우', '현우', '도현', '지훈', '건우', '우진', '선우', '서진', '민재', '현준', '연우', '유준', '정우', '승현', '승우', '시윤', '준혁', '은우', '지환', '승민'];
const domains = ['gmail.com', 'naver.com', 'daum.net', 'outlook.com', 'kakao.com', 'test.co.kr', 'company.kr', 'corp.com'];
const cities = ['서울시', '경기도 수원시', '경기도 성남시', '부산시', '대구시', '인천시', '광주시', '대전시', '울산시', '세종시', '강원도 춘천시', '충북 청주시', '충남 천안시', '전북 전주시', '전남 목포시', '경북 포항시', '경남 창원시', '제주도 제주시'];
const dongs = ['역삼동', '서현동', '분당동', '해운대동', '중동', '구월동', '용봉동', '봉명동', '삼산동', '조치원읍', '효자동', '상도동', '연동'];
const memos = ['VIP 고객', '일반 고객', '신규 가입', '해약 예정', '문의 중', '활동고객', '관리 필요', '휴면 전환', '재활성화', '우수 고객', '계약 만료', '자동이체', '주소 변경', '핵심 고객', '이메일 변경', 'VIP 검토', '관심 고객', '미납 이력', '상담 완료', '후속 조치'];
const htmlTags = ['<p>', '<b>', '<span>', '<div>', '<em>', '<strong>', '<i>', ''];
const emojis = ['👍', '✨', '📧', '🌟', '✅', '📩', '🎉', '💼', '🔥', '⭐', ''];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// 전화번호 변형 생성
function genPhone() {
    const mid = String(randInt(1000, 9999));
    const last = String(randInt(1000, 9999));
    const formats = [
        `010${mid}${last}`,
        `010-${mid}-${last}`,
        `010 ${mid} ${last}`,
        `01${randInt(0, 1)}${mid}${last}`,
    ];
    return rand(formats);
}

// 날짜 변형 생성
function genDate() {
    const y = randInt(2023, 2025);
    const m = randInt(1, 12);
    const d = randInt(1, 28);
    const formats = [
        `${y}-${m}-${d}`,
        `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`,
        `${y}.${m}.${d}`,
        `${String(y).slice(2)}/${m}/${d}`,
        `${String(y).slice(2)}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        `${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}`,
    ];
    return rand(formats);
}

// 금액 변형 생성
function genAmount() {
    const base = randInt(100000, 99000000);
    const formats = [
        String(base),
        `(${base})`,        // 회계 음수
        `△${base}`,         // 세모 음수
        `${base.toExponential(2)}`, // 지수 표기
        `${base.toLocaleString()}`, // 콤마 포함
    ];
    return rand(formats);
}

// 사업자번호 변형
function genBizNum() {
    const n = String(randInt(1000000000, 9999999999));
    const formats = [
        n,
        `${n.slice(0, 3)}-${n.slice(3, 5)}-${n.slice(5)}`,
    ];
    return rand(formats);
}

// 이메일 변형
function genEmail(name) {
    const valid = [`${name}@${rand(domains)}`, `${name}.user@${rand(domains)}`];
    const invalid = ['invalid-email', `${name}@`, `@${rand(domains)}`, `${name}@@${rand(domains)}`];
    return Math.random() > 0.15 ? rand(valid) : rand(invalid);
}

// 메모 변형 (HTML/이모지 혼합)
function genMemo() {
    const base = rand(memos);
    const emoji = rand(emojis);
    const tag = rand(htmlTags);
    if (tag) {
        const closeTag = tag.replace('<', '</');
        return `${tag}${base}${closeTag} ${emoji}`;
    }
    return `${base} ${emoji}`;
}

// CSV 생성
const headers = '이름,전화번호,이메일,주소,금액,날짜,사업자번호,메모';
const rows = [headers];

for (let i = 0; i < 1500; i++) {
    const last = rand(lastNames);
    const first = rand(firstNames);
    const name = `${last}${first}`;

    // 이름에 공백 변형 추가 (20% 확률)
    const nameVariant = Math.random() > 0.8 ? `  ${name}  ` : name;

    const phone = genPhone();
    const email = genEmail(name.toLowerCase().replace(/[가-힣]/g, (c) => {
        const code = c.charCodeAt(0) - 0xAC00;
        const cho = ['g', 'kk', 'n', 'd', 'dd', 'r', 'm', 'b', 'bb', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
        return cho[Math.floor(code / 588)] || 'u';
    }).slice(0, 5));
    const city = rand(cities);
    const dong = rand(dongs);
    const addr = Math.random() > 0.7 ? `  ${city} ${dong} ${randInt(1, 999)}  ` : `${city} ${dong} ${randInt(1, 999)}-${randInt(1, 99)}`;
    const amount = genAmount();
    const date = genDate();
    const bizNum = genBizNum();
    const memo = genMemo();

    // CSV 이스케이프 (쉼표나 따옴표 포함 시)
    const escapeCsv = (val) => {
        const s = String(val);
        if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('<')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };

    rows.push([nameVariant, phone, email, addr, amount, date, bizNum, memo].map(escapeCsv).join(','));
}

fs.writeFileSync('f:/vibeWork/data-clean-ai/public/test-performance-1500.csv', rows.join('\n'), 'utf-8');
console.log(`✅ 생성 완료: ${rows.length - 1}줄 (헤더 제외)`);
