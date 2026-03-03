import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestCredential, MeteorDeveloperAccounts } from './meteor-developer-oauth.ts';
import { OAuth } from 'meteor/oauth';

// 1. Mock the Meteor dependencies
vi.mock('meteor/oauth', () => ({
  OAuth: {
    _loginStyle: vi.fn(),
    _stateParam: vi.fn(),
    _redirectUri: vi.fn(),
    launchLogin: vi.fn(),
  }
}));

vi.mock('meteor/random', () => ({
  Random: {
    secret: vi.fn(() => 'mocked-credential-token'),
  }
}));

describe('Meteor Developer OAuth Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MeteorDeveloperAccounts.server = 'https://www.meteor.com';
  });

  it('runs service oauth with mocked flow as expected', () => {
    // Setup mock config payload
    const mockConfig = {
      clientId: 'mock-client-id',
      secret: 'mock-secret',
      loginStyle: 'popup'
    } as const; 

    // Setup mock OAuth responses
    vi.mocked(OAuth._loginStyle).mockReturnValue('popup');
    vi.mocked(OAuth._stateParam).mockReturnValue('mock-state-param');
    vi.mocked(OAuth._redirectUri).mockReturnValue('https://app.com/_oauth/meteor-developer');

    // Execute (passing config directly)
    requestCredential(mockConfig, {});

    // Assertions
    expect(OAuth._loginStyle).toHaveBeenCalledWith(
      'meteor-developer', 
      mockConfig, 
      expect.any(Object)
    );
    
    expect(OAuth.launchLogin).toHaveBeenCalledWith(expect.objectContaining({
      loginService: 'meteor-developer',
      loginStyle: 'popup',
      credentialToken: 'mocked-credential-token',
      loginUrl: expect.stringContaining('https://www.meteor.com/oauth2/authorize?state=mock-state-param&response_type=code&client_id=mock-client-id&redirect_uri=https://app.com/_oauth/meteor-developer'),
      popupOptions: { width: 497, height: 749 }
    }));
  });

  it('fails gracefully and calls callback if config is invalid', () => {
    const mockCallback = vi.fn();

    requestCredential({}, mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(expect.any(Error));
    expect(mockCallback.mock.calls[0][0].message).toBe('Service meteor-developer is missing clientId in configuration');
    expect(OAuth.launchLogin).not.toHaveBeenCalled();
  });

  it('allows overriding the developer accounts server', () => {
    MeteorDeveloperAccounts.config({ developerAccountsServer: 'https://dev.meteor.test' });
    expect(MeteorDeveloperAccounts.server).toBe('https://dev.meteor.test');
  });
});