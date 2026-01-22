# 데이터세탁소 (Data Laundry) 🧺

**"지저분한 데이터를 새것처럼"**

데이터세탁소는 뒤죽박죽 섞인 엑셀, CSV 데이터를 빠르고 간편하게 정제해주는 웹 도구입니다. 모든 데이터 처리는 서버로 전송되지 않고 **사용자의 브라우저 내부에서 안전하게 진행**되므로, 민감한 개인정보가 포함된 파일도 안심하고 사용할 수 있습니다.

[👉 **서비스 바로가기**](https://neverloselkb.github.io/DataLaundry/)

## 주요 기능 ✨

- **📞 연락처 정제**: 휴대폰(010), 유선 전화번호 형식을 깔끔하게 통일 (예: `010-1234-5678`)
- **📅 날짜/시간 표준화**: 전 세계 다양한 날짜 형식(ISO, US, EU, KR)을 자동으로 인식하여 표준 포맷으로 변환
- **💰 금액 데이터 복구**: '3만 5천원', '1.5억원' 등 한글이 섞인 금액을 계산 가능한 숫자로 자동 변환
- **🧹 스마트 노이즈 제거**: 이름이나 텍스트에 섞인 특수문자, 숫자 등 불필요한 노이즈 정리
- **🔒 완벽한 보안**: Web Worker 기술을 활용하여 모든 연산이 로컬 PC에서 이루어짐 (서버 저장 X)
- **🤖 자연어 처리**: "주소가 없는 데이터는 지워줘"와 같은 문장을 이해하고 처리

## 개발자 도와주기 ☕

이 서비스가 업무 효율을 높이는 데 도움이 되셨나요?
개발자에게 따뜻한 커피 한 잔의 후원은 서비스의 지속적인 운영과 새로운 기능 개발에 큰 힘이 됩니다!

<img src="public/kakaopay-qr.png" width="300" alt="카카오페이 후원 QR코드">

**(카카오페이 실행 > 결제 > QR 스캔)**

## 설치 및 실행 (로컬 환경)

이 프로젝트를 로컬 컴퓨터에서 직접 실행하려면 다음 단계를 따르세요.

```bash
# 1. 저장소 복제
git clone https://github.com/neverloselkb/DataLaundry.git
cd DataLaundry

# 2. 패키지 설치
npm install
# or
yarn install

# 3. 개발 서버 실행
npm run dev
# or
yarn dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하실 수 있습니다.

## 기술 스택 🛠️

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn/UI
- **Deployment**: GitHub Pages (Static Export)
