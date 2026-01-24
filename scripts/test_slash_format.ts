
import fs from 'fs';
import path from 'path';

async function testGeminiApiData() {
    const testData = [
        { id: 1, date: "2024-01-01", name: "User A" }, // 이미 하이픈
        { id: 2, date: "2023.12.31", name: "User B" }, // 점
        { id: 3, date: "2024/05/05", name: "User C" }  // 슬래시
    ];

    // 사용자가 실패했다고 한 케이스: 슬래시 포맷 요청
    const prompt = "Date컬럼의 날짜 형식을 [yyyy/MM/dd] 형식으로 변경";

    console.log("Input Data:", JSON.stringify(testData, null, 2));
    console.log("Prompt:", prompt);
    console.log("Sending request to http://localhost:3000/api/clean ...");

    try {
        const response = await fetch('http://localhost:3000/api/clean', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: testData,
                prompt: prompt
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText}\n${errorText}`);
        }

        const result = await response.json();
        console.log("\n--- API Response ---");
        console.log(JSON.stringify(result, null, 2));

        if (result.processedData) {
            const firstDate = result.processedData[0].date;
            const secondDate = result.processedData[1].date;

            // 기대 결과: 모든 날짜가 yyyy/MM/dd 형식이어야 함
            const isSlashFormat = (d: string) => /^\d{4}\/\d{2}\/\d{2}$/.test(d);

            if (isSlashFormat(firstDate) && isSlashFormat(secondDate)) {
                console.log("\n✅ SUCCESS: Date format changed to Slash (yyyy/MM/dd).");
            } else {
                console.log(`\n❌ FAILURE: Date format mismatch.`);
                console.log(`Expected 'yyyy/MM/dd', got '${firstDate}', '${secondDate}'`);
            }
        }

    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testGeminiApiData();
