// Netlify Serverless Function - KST 시간 API
// GET /.netlify/functions/time 또는 /api/time (rewrite 설정 시)

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // GET 요청만 처리
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // 서버의 현재 시간을 가져옴 (UTC)
    const now = new Date();
    
    // KST 시간 계산 (UTC+9)
    const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    
    // ISO 8601 형식으로 KST 시간 문자열 생성
    const year = kstTime.getUTCFullYear();
    const month = String(kstTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(kstTime.getUTCDate()).padStart(2, '0');
    const hours = String(kstTime.getUTCHours()).padStart(2, '0');
    const minutes = String(kstTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(kstTime.getUTCSeconds()).padStart(2, '0');
    
    const kstDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+09:00`;
    
    // 다양한 형식으로 응답 반환
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        time: kstDateTime,
        kst_time: kstDateTime,
        datetime: kstDateTime,
        timestamp: now.getTime(),
        epochSecond: Math.floor(now.getTime() / 1000),
        utcTime: now.toISOString(),
        timezone: 'Asia/Seoul',
        offset: '+09:00'
      })
    };
  } catch (error) {
    console.error('Error getting time:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

