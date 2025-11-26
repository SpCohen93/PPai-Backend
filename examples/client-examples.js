/**
 * Example client code for Adobe Premiere Pro UXP Plugin
 * 
 * These are generic JavaScript examples you can use in your panel code.
 * Replace <your-site> with your actual Netlify site URL.
 * Replace <your-license-token> with your actual license token.
 */

const API_BASE_URL = 'https://<your-site>.netlify.app/.netlify/functions';
const LICENSE_TOKEN = '<your-license-token>';

/**
 * Example: Call the aiCommand function
 * 
 * @param {string} prompt - The natural language prompt for Gemini
 * @param {object} context - Optional context object
 * @returns {Promise<object>} Response with result field
 */
async function callAiCommand(prompt, context = null) {
  try {
    const response = await fetch(`${API_BASE_URL}/aiCommand`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LICENSE_TOKEN}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        context: context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling aiCommand:', error);
    throw error;
  }
}

/**
 * Example: Call the youtubeSearch function
 * 
 * @param {string} query - The search query
 * @returns {Promise<object>} Response with results array
 */
async function searchYouTube(query) {
  try {
    const response = await fetch(`${API_BASE_URL}/youtubeSearch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LICENSE_TOKEN}`,
      },
      body: JSON.stringify({
        query: query,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling youtubeSearch:', error);
    throw error;
  }
}

/**
 * Example usage in your Premiere plugin panel:
 */

// Example 1: Simple AI command
async function example1() {
  try {
    const response = await callAiCommand('Create a new sequence called "My Edit"');
    console.log('AI Response:', response.result);
    // Use response.result to drive Premiere automation
  } catch (error) {
    console.error('Failed to get AI response:', error);
  }
}

// Example 2: AI command with context
async function example2() {
  try {
    const context = {
      currentProject: 'My Project',
      activeSequence: 'Sequence 1',
      selectedClips: ['Clip A', 'Clip B'],
    };
    
    const response = await callAiCommand(
      'Add markers to the selected clips',
      context
    );
    console.log('AI Response:', response.result);
  } catch (error) {
    console.error('Failed to get AI response:', error);
  }
}

// Example 3: YouTube search
async function example3() {
  try {
    const response = await searchYouTube('premiere pro tutorial');
    console.log('Found videos:', response.results);
    
    // response.results is an array of:
    // {
    //   title: string,
    //   url: string,
    //   channel: string,
    //   thumbnails: { default, medium, high }
    // }
  } catch (error) {
    console.error('Failed to search YouTube:', error);
  }
}

// Export for use in your plugin
// module.exports = { callAiCommand, searchYouTube };

