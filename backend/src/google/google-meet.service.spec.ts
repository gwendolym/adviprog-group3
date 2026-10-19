import { GoogleMeetService } from './google-meet.service.js';

describe('GoogleMeetService', () => {
  const fetchMock = vi.fn();
  let service: GoogleMeetService;

  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
  const meetUri = 'https://meet.google.com/abc-defg-hij';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('GOOGLE_CLIENT_ID', 'client');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'secret');
    vi.stubEnv('GOOGLE_MEET_REFRESH_TOKEN', 'refresh');
    vi.stubGlobal('fetch', fetchMock);
    service = new GoogleMeetService();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('creates an open Meet space with the shared account', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { access_token: 'access', expires_in: 3600 }))
      .mockResolvedValueOnce(json(200, { meetingUri: meetUri }));

    await expect(service.createMeeting()).resolves.toBe(meetUri);
    expect(String(fetchMock.mock.calls[0][1].body)).toContain('refresh_token=refresh');
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer access');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ config: { accessType: 'OPEN' } });
  });

  it('reuses the access token until it expires', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { access_token: 'access', expires_in: 3600 }))
      .mockResolvedValueOnce(json(200, { meetingUri: meetUri }))
      .mockResolvedValueOnce(json(200, { meetingUri: meetUri }));

    await service.createMeeting();
    await service.createMeeting();

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('returns null when Google refuses the refresh token', async () => {
    fetchMock.mockResolvedValueOnce(json(400, { error: 'invalid_grant' }));

    await expect(service.createMeeting()).resolves.toBeNull();
  });

  it('returns null when Meet creation fails', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { access_token: 'access' }))
      .mockResolvedValueOnce(json(403, { error: 'forbidden' }));

    await expect(service.createMeeting()).resolves.toBeNull();
  });

  it('does nothing when no shared account is configured', async () => {
    vi.stubEnv('GOOGLE_MEET_REFRESH_TOKEN', '');

    await expect(service.createMeeting()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
