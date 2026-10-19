import { Injectable, Logger } from '@nestjs/common';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const SPACES_ENDPOINT = 'https://meet.googleapis.com/v2/spaces';

/**
 * Creates Meet links from one shared Google account. Its refresh token comes from
 * GOOGLE_MEET_REFRESH_TOKEN. 
 */
@Injectable()
export class GoogleMeetService {
  private readonly logger = new Logger(GoogleMeetService.name);
  private accessToken: { value: string; expiresAt: number } | null = null;

  get enabled(): boolean {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_MEET_REFRESH_TOKEN);
  }

  async createMeeting(): Promise<string | null> {
    if (!this.enabled) {
      return null;
    }
    try {
      const response = await fetch(SPACES_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await this.getAccessToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { accessType: 'OPEN' } }),
      });
      if (!response.ok) {
        this.logger.warn(`Meet space creation failed: ${response.status} ${await response.text()}`);
        return null;
      }
      const space = (await response.json()) as { meetingUri?: string };
      return space.meetingUri ?? null;
    } catch (error) {
      this.logger.warn(`Meet space creation failed: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now()) {
      return this.accessToken.value;
    }
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: process.env.GOOGLE_MEET_REFRESH_TOKEN!,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    });
    if (!response.ok) {
      throw new Error(
        `token refresh failed: ${response.status} ${await response.text()} (run \`npm run google:meet-token\` to get a new GOOGLE_MEET_REFRESH_TOKEN)`,
      );
    }
    const body = (await response.json()) as { access_token: string; expires_in?: number };
    this.accessToken = { value: body.access_token, expiresAt: Date.now() + ((body.expires_in ?? 3600) - 60) * 1000 };
    return body.access_token;
  }
}
