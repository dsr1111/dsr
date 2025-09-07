// netlify/functions/time.js
export async function handler() {
    try {
        // 한국 시간대의 현재 시각을 ISO 형식으로 가져오기
        const now = new Date();
        const kstTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
        
        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
            },
            body: JSON.stringify({ 
                status: "OK",
                formatted: kstTime.toISOString().replace('Z', '+09:00'),
                timestamp: kstTime.getTime()
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                status: "ERROR",
                message: error.message 
            })
        };
    }
}
  