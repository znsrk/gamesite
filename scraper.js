const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// CONFIGURATION
// Replace these with your actual Supabase details
const SUPABASE_URL = 'https://pliylwjqkcrmjewklnio.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_fWPzYzv8JgZcwVy_RQX4JA_1eazX98b'; 

// Range of IDs to scrape
const START_ID = 1;
const END_ID = 80000;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeAndUpload() {
  console.log(`Starting scrape for IDs ${START_ID} to ${END_ID}...`);

  for (let id = START_ID; id <= END_ID; id++) {
    try {
      const feedUrl = `https://gamemonetize.com/feed.php?format=0&id=${id}`;
      
      // 1. Fetch data from GameMonetize
      const response = await axios.get(feedUrl);
      const games = response.data;

      if (!Array.isArray(games) || games.length === 0) {
        console.warn(`[ID: ${id}] No game data found (empty array). Skipping.`);
        continue;
      }

      const gameData = games[0]; // The feed returns an array with one object

      // 2. Map JSON data to your Supabase Table structure
      // Your admin panel logic: game_id = url, thumbnail_url = thumb, etc.
      const dbPayload = {
        game_id: gameData.url,          // Direct URL from feed (no iframe extraction needed)
        title: gameData.title,
        description: gameData.description,
        thumbnail_url: gameData.thumb,
        category: gameData.category,
        order_index: 0,                 // Defaulting to 0 like your form
        is_active: true                 // Hardcoded true like your form
      };

      // 3. Insert into Supabase
      // Using 'upsert' to update if it already exists, or 'insert' to add new
      const { data, error } = await supabase
        .from('games')
        .upsert([dbPayload], { onConflict: 'game_id' }) // Assumes game_id is unique
        .select();

      if (error) {
        console.error(`[ID: ${id}] Database Error:`, error.message);
      } else {
        console.log(`[ID: ${id}] Success: Added "${gameData.title}"`);
      }

    } catch (err) {
      console.error(`[ID: ${id}] Request Failed:`, err.message);
    }

    // Optional: Be nice to the API and wait 500ms between requests
    await sleep(1500);
  }

  console.log('Scraping finished.');
}

scrapeAndUpload();
