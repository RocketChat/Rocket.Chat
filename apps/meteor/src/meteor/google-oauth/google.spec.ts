import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Google, type GoogleRequestCredentialOptions } from './google';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { OAuth } from 'meteor/oauth';

// Mock dependencies
vi.mock('meteor/service-configuration', () => ({
  ServiceConfiguration: {
    configurations: {
      findOne: vi.fn(),
    }
  }
}));

vi.mock('meteor/random', () => ({
  Random: {
    secret: vi.fn(() => 'mocked-secret'),
  }
}));

vi.mock('meteor/oauth', () => ({
  OAuth: {
    _loginStyle: vi.fn(() => 'popup'),
    _redirectUri: vi.fn(() => 'http://localhost/redirect'),
    _stateParam: vi.fn(() => 'mocked-state'),
    launchLogin: vi.fn(),
  }
}));

describe('Google OAuth (Frontend)', () => {
  beforeEach(() => {
    // Default happy path config
    vi.mocked(ServiceConfiguration.configurations.findOne).mockReturnValue({
      service: 'google',
      clientId: 'test-client-id'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return an error if the service is not configured', () => {
    vi.mocked(ServiceConfiguration.configurations.findOne).mockReturnValue(null);
    const callback = vi.fn();

    Google.requestCredential({}, callback);

    expect(callback).toHaveBeenCalledWith(new Error("Service not configured"));
    expect(OAuth.launchLogin).not.toHaveBeenCalled();
  });

  it('run service oauth with mocked flow as expected', () => {
    Google.requestCredential({});

    // Assert that the OAuth helper functions were called in the expected flow
    expect(OAuth._loginStyle).toHaveBeenCalledWith('google', { service: 'google', clientId: 'test-client-id' }, {});
    expect(OAuth._redirectUri).toHaveBeenCalledWith('google', { service: 'google', clientId: 'test-client-id' });
    expect(OAuth._stateParam).toHaveBeenCalledWith('popup', 'mocked-secret', undefined);
    
    // Assert launchLogin was called with correct arguments
    expect(OAuth.launchLogin).toHaveBeenCalledWith({
      loginService: "google",
      loginStyle: "popup",
      loginUrl: "https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=test-client-id&scope=email%20profile&redirect_uri=http%3A%2F%2Flocalhost%2Fredirect&state=mocked-state",
      credentialRequestCompleteCallback: undefined,
      credentialToken: "mocked-secret",
      popupOptions: { height: 600 }
    });
  });

  it('throws an error if an illegal parameter is passed in loginUrlParameters', () => {
    const options: GoogleRequestCredentialOptions = {
      loginUrlParameters: { client_id: 'malicious-id' }
    };

    expect(() => {
      Google.requestCredential(options);
    }).toThrow('Google.requestCredential: Invalid loginUrlParameter: client_id');
  });

  it('correctly maps backwards compatible options like requestOfflineToken and forceApprovalPrompt', () => {
    const options: GoogleRequestCredentialOptions = {
      requestOfflineToken: true,
      forceApprovalPrompt: true,
      loginHint: 'test@example.com'
    };

    Google.requestCredential(options);

    // Verify the URL includes the mapped parameters
    const mockCall = vi.mocked(OAuth.launchLogin).mock.calls[0][0];
    expect(mockCall.loginUrl).toContain('access_type=offline');
    expect(mockCall.loginUrl).toContain('prompt=consent');
    expect(mockCall.loginUrl).toContain('login_hint=test%40example.com');
  });
});