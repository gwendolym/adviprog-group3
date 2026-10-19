// One-time setup: sign in with the shared Google account that should own all
// Meet links, then copy the printed GOOGLE_MEET_REFRESH_TOKEN into .env.
//
// Before running, add this redirect URI to the OAuth client in Google Cloud Console
// (APIs & Services → Credentials → your client → Authorized redirect URIs):
//   http://localhost:5555/oauth2callback
//
// Run from backend/: npm run google:meet-token
import { createServer } from 'node:http';

const PORT = 5555;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = 'https://www.googleapis.com/auth/meetings.space.created';

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
  process.exit(1);
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.search = new URLSearchParams({
  client_id: clientId,
  redirect_uri: REDIRECT_URI,
  response_type: 'code',
  scope: SCOPE,
  access_type: 'offline',
  prompt: 'consent',
}).toString();

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', REDIRECT_URI);
  if (url.pathname !== '/oauth2callback') {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get('code');
  if (!code) {
    res.end(`Google returned an error: ${url.searchParams.get('error')}`);
    console.error('Authorization failed:', url.searchParams.get('error'));
    server.close();
    process.exitCode = 1;
    return;
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const body = await response.json();

  if (!response.ok || !body.refresh_token) {
    res.end('Could not get a refresh token. See the terminal.');
    console.error('Token exchange failed:', body);
    process.exitCode = 1;
  } else {
    res.end('Done. You can close this tab and go back to the terminal.');
    console.log('\nAdd this line to .env, then restart the backend:\n');
    console.log(`GOOGLE_MEET_REFRESH_TOKEN=${body.refresh_token}\n`);
  }
  server.close();
});

server.listen(PORT, () => {
  console.log('Open this URL and sign in with the shared Google account:\n');
  console.log(`${authUrl}\n`);
});
