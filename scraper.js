const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// CONFIGURATION
// Replace these with your actual Supabase details
const SUPABASE_URL = 'https://pliylwjqkcrmjewklnio.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_fWPzYzv8JgZcwVy_RQX4JA_1eazX98b';

// Range of IDs to scrape
const START_ID = 30500;
const END_ID = 80000;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// User agent rotation list - rotate these to avoid detection
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
];

// Track consecutive failures for exponential backoff
let consecutiveFailures = 0;
const maxRetries = 3;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

async function makeRequestWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const headers = {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site'
      };

      const response = await axios.get(url, {
        headers,
        timeout: 10000 // 10 second timeout
      });

      // Reset failure counter on success
      consecutiveFailures = 0;
      return response;

    } catch (error) {
      consecutiveFailures++;
      
      if (error.response?.status === 429) {
        console.log(`[ID] 429 Too Many Requests. Waiting ${Math.min(2 ** attempt * 1000, 30000)}ms before retry ${attempt}/${maxRetries}`);
        await sleep(Math.min(2 ** attempt * 1000, 30000)); // Exponential backoff, max 30s
      } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        console.log(`[ID] Connection timeout. Waiting ${attempt * 2000}ms before retry ${attempt}/${maxRetries}`);
        await sleep(attempt * 2000);
      } else {
        console.error(`[ID] Request error (attempt ${attempt}):`, error.message);
        if (attempt === maxRetries) throw error;
        await sleep(2000);
      }
    }
  }
  throw new Error('Max retries exceeded');
}

async function scrapeAndUpload() {
  console.log(`Starting scrape for IDs ${START_ID} to ${END_ID}...`);
  
  for (let id = START_ID; id <= END_ID; id++) {
    try {
      const feedUrl = `https://gamemonetize.com/feed.php?format=0&id=${id}`;
      
      // 1. Fetch data from GameMonetize with retry logic
      const response = await makeRequestWithRetry(feedUrl);
      const games = response.data;

      if (!Array.isArray(games) || games.length === 0) {
        console.warn(`[ID: ${id}] No game data found (empty array). Skipping.`);
        // Still be polite even on skips
        await sleep(1000 + Math.random() * 2000);
        continue;
      }

      // Parse games from JSON (same as admin page)
      const parsedGames = games.map(game => ({
        game_id: game.url,
        title: game.title,
        description: game.description,
        category: game.category
      }));

      // 2. Insert into Supabase (same as admin page)
      const { data, error } = await supabase
        .from('games')
        .insert(parsedGames);

      if (error) {
        console.error(`[ID: ${id}] Database Error:`, error.message);
      } else {
        console.log(`[ID: ${id}] Success: Added "${parsedGames[0].title}" (${games.length} games)`);
      }

    } catch (err) {
      console.error(`[ID: ${id}] Request Failed:`, err.message);
      
      // Progressive backoff based on consecutive failures
      const backoffDelay = Math.min(5000 + (consecutiveFailures * 2000), 30000);
      console.log(`Waiting ${backoffDelay}ms due to ${consecutiveFailures} consecutive failures...`);
      await sleep(backoffDelay);
    }
  }
  
  console.log('Scraping finished.');
}

// Run the scraper
scrapeAndUpload().catch(console.error);
