
import fs from 'fs';
import path from 'path';

async function testGeminiApi() {
    const testData = [
        { id: 1, date: "2024.01.01", name: "홍길동", price: 1000 },
        { id: 2, date: "2023.12.31", name: "김철수", price: 25000 },
        { id: 3, date: "2024/05/05", name: "이영희", price: 500 }
    ];

    const prompt = "날짜를 yyyy-MM-dd 형식으로 바꾸고, 금액에 콤마를 넣어줘.";

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
            if (firstDate === "2024-01-01") {
                console.log("\n✅ SUCCESS: Date format changed correctly.");
            } else {
                console.log(`\n❌ FAILURE: Date format mismatch. Expected '2024-01-01', got '${firstDate}'`);
            }
        }

    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testGeminiApi();
