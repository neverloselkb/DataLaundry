const XLSX = require('xlsx');

const data = [
    { "이름": " 홍길동 ", "휴대폰번호": "01012345678", "주소": "서울시 강남구 역삼동 123", "가입일": "2023-01-01" },
    { "이름": "김철수", "휴대폰번호": "010-9876-5432", "주소": "부산광역시 해운대구 우동 456", "가입일": "2023-02-15" },
    { "이름": " 이영희 ", "휴대폰번호": "010 5555 7777", "주소": "경기도 성남시 분당구 판교동 789", "가입일": "2023-03-20" },
    { "이름": " 홍길동 ", "휴대폰번호": "01012345678", "주소": "서울시 강남구 역삼동 123", "가입일": "2023-01-01" }, // Duplicate
    { "이름": "박지민", "휴대폰번호": "01011112222", "주소": "인천광역시 연수구 송도동 101", "가입일": "2023-04-05" },
    { "이름": "최민수 ", "휴대폰번호": "010-2222-3333", "주소": "대구광역시 수성구 범어동 202", "가입일": "2023-05-10" }
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

XLSX.writeFile(workbook, "dummy_messy_data.xlsx");
console.log("dummy_messy_data.xlsx generated successfully.");
