// This is your secure, server-side function.
// It can safely use secrets like API keys.

exports.handler = async function(event, context) {
    // --- Configuration (Keep your secrets here) ---
    const API_KEY = process.env.GOOGLE_SHEETS_API_KEY; // Securely access your API key
    const SPREADSHEET_ID = '1vI0Ip4--bTwoyWa7TZRyxG9YqYx-YqRnBMaBjo1d3KA';
    const RANGE = "'Rate for SCI'!A1:B1";
    const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(RANGE)}?key=${API_KEY}`;

    try {
        // The 'node-fetch' library is needed to make requests in a Node.js environment.
        // Netlify functions automatically support it.
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(API_URL);

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `API request failed: ${response.statusText}` }),
            };
        }

        const data = await response.json();

        if (!data.values || !data.values[0]) {
            throw new Error("No data returned from API. Check Sheet name and range.");
        }
        
        const rates = data.values[0];
        const mmk_thb = parseFloat(rates[0]);
        const thb_mmk = parseFloat(rates[1]);

        // Send the clean data back to the frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ mmk_thb, thb_mmk }),
        };

    } catch (error) {
        console.error('Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch currency rate.' }),
        };
    }
};