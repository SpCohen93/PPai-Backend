# PPai Backend API

Backend API for Adobe Premiere Pro UXP Plugin, hosted on Netlify Functions.

This backend securely proxies requests to Google Gemini API and YouTube Data API, keeping API keys server-side and never exposing them to the client plugin.

## Project Structure

```
PPai-Backend/
├── src/
│   ├── aiCommand.ts          # Main AI command function
│   ├── youtubeSearch.ts      # YouTube search function
│   └── utils/
│       ├── license.ts        # License validation utilities
│       └── errors.ts         # Error handling utilities
├── netlify/
│   └── functions/            # Compiled JavaScript (generated)
├── examples/
│   └── client-examples.js    # Example client code for your plugin
├── package.json
├── tsconfig.json
├── netlify.toml
└── README.md
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build TypeScript

```bash
npm run build
```

This compiles TypeScript files from `src/` to `netlify/functions/`.

### 3. Environment Variables

Set these in your Netlify dashboard (Site settings → Environment variables):

- `GEMINI_API_KEY` - Your Google Gemini API key
- `YOUTUBE_API_KEY` - Your YouTube Data API v3 key (optional, only if using youtubeSearch)
- `LICENSE_TOKENS` - Comma-separated list of valid license tokens (e.g., `token1,token2,token3`)

**Note:** In development mode, if `LICENSE_TOKENS` is not set, all requests will be allowed (with a warning). In production, requests without valid tokens will be rejected.

## Local Development

### Using Netlify CLI

```bash
# Install Netlify CLI globally (if not already installed)
npm install -g netlify-cli

# Start local development server
npm run dev
```

This will:
- Start a local server at `http://localhost:8888`
- Hot-reload on changes
- Use environment variables from `.env` file (create one if needed)

### Testing Functions Locally

```bash
# Test aiCommand
curl -X POST http://localhost:8888/.netlify/functions/aiCommand \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"prompt": "Hello, world"}'

# Test youtubeSearch
curl -X POST http://localhost:8888/.netlify/functions/youtubeSearch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"query": "premiere pro tutorial"}'
```

## Deployment to Netlify

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Connect to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Netlify will auto-detect the build settings from `netlify.toml`

### 3. Build Settings

Netlify should auto-detect these from `netlify.toml`:
- **Build command:** `npm run build`
- **Functions directory:** `netlify/functions`
- **Publish directory:** (leave empty, functions-only setup)

If you need to set manually:
- Build command: `npm run build`
- Publish directory: (leave empty)

### 4. Set Environment Variables

In Netlify Dashboard → Site settings → Environment variables, add:
- `GEMINI_API_KEY`
- `YOUTUBE_API_KEY` (optional)
- `LICENSE_TOKENS`

### 5. Deploy

After connecting the repo, Netlify will automatically deploy. You can also trigger deployments manually or via Git pushes.

## Function URLs

Once deployed, your functions will be available at:

- **aiCommand:** `https://<your-site>.netlify.app/.netlify/functions/aiCommand`
- **youtubeSearch:** `https://<your-site>.netlify.app/.netlify/functions/youtubeSearch`

Replace `<your-site>` with your actual Netlify site name (e.g., `my-ppai-backend-123`).

## API Reference

### aiCommand

**Endpoint:** `POST /.netlify/functions/aiCommand`

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <license-token>`

**Request Body:**
```json
{
  "prompt": "string (required)",
  "context": { ... } // optional object
}
```

**Response:**
```json
{
  "result": "string (Gemini response)"
}
```

**Error Responses:**
- `400` - Bad Request (missing/invalid prompt)
- `401` - Unauthorized (invalid/missing license token)
- `500` - Internal Server Error

### youtubeSearch

**Endpoint:** `POST /.netlify/functions/youtubeSearch`

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <license-token>`

**Request Body:**
```json
{
  "query": "string (required)"
}
```

**Response:**
```json
{
  "results": [
    {
      "title": "string",
      "url": "string",
      "channel": "string",
      "thumbnails": {
        "default": "string (optional)",
        "medium": "string (optional)",
        "high": "string (optional)"
      }
    }
  ]
}
```

**Error Responses:**
- `400` - Bad Request (missing/invalid query)
- `401` - Unauthorized (invalid/missing license token)
- `500` - Internal Server Error

## Client Integration

See `examples/client-examples.js` for complete client code examples you can use in your Premiere plugin.

### Quick Example

```javascript
const response = await fetch('https://<your-site>.netlify.app/.netlify/functions/aiCommand', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <your-license-token>',
  },
  body: JSON.stringify({
    prompt: 'Create a new sequence',
  }),
});

const data = await response.json();
console.log(data.result);
```

### Updating Your Premiere Plugin Manifest

Add your Netlify domain to `manifest.json`:

```json
{
  "requiredPermissions": {
    "network": {
      "domains": [
        "https://<your-site>.netlify.app"
      ]
    }
  }
}
```

## License Validation

Currently, license validation checks tokens against a whitelist from the `LICENSE_TOKENS` environment variable.

To extend this for production (e.g., Stripe, database):

1. Edit `src/utils/license.ts`
2. Modify the `validateLicense()` function to:
   - Check against a database
   - Validate Stripe subscription status
   - Check expiration dates
   - etc.

The function signature and return type remain the same, so no other code changes are needed.

## Extending the API

### Adding New Functions

1. Create a new file in `src/functions/` (e.g., `myNewFunction.ts`)
2. Export a `handler` function with the `Handler` type from `@netlify/functions`
3. Rebuild: `npm run build`
4. Deploy to Netlify

### Modifying aiCommand Response Format

The `aiCommand` function currently returns `{ result: <gemini-response> }`. To return structured editing commands:

1. Edit `src/functions/aiCommand.ts`
2. Parse the Gemini response to extract structured commands
3. Return a different format, e.g.:
   ```typescript
   {
     commands: [
       { type: 'createSequence', name: '...' },
       { type: 'addMarker', time: '...' },
     ]
   }
   ```

## Security Notes

- ✅ API keys are never exposed to the client
- ✅ License tokens are validated on every request
- ✅ CORS is configured for Adobe UXP plugins
- ✅ Errors don't leak internal details
- ⚠️ For production, consider:
  - Rate limiting
  - Request logging/monitoring
  - More sophisticated license validation
  - API key rotation

## Troubleshooting

### Functions not found after deployment

- Ensure `npm run build` completes successfully
- Check that compiled `.js` files exist in `netlify/functions/`
- Verify `netlify.toml` has correct `functions` directory

### 401 Unauthorized errors

- Check that `LICENSE_TOKENS` is set in Netlify environment variables
- Verify the token in the Authorization header matches one in the whitelist
- In development, ensure `NODE_ENV` is set to `development` if you want to bypass validation

### 500 Internal Server Error

- Check Netlify function logs (Site → Functions → View logs)
- Verify `GEMINI_API_KEY` and `YOUTUBE_API_KEY` are set correctly
- Ensure API keys are valid and have proper permissions

## License

MIT

