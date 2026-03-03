import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuth } from 'meteor/oauth';
import { OAuthAuthMixin } from 'meteor/accounts-oauth';

// 1. Mock the core Meteor module to provide a dummy connection
// This satisfies the AccountsClient constructor during module evaluation.
vi.mock('meteor/meteor', () => {
  class MockError extends Error {
    error: string | number;
    constructor(error: string | number, reason?: string) {
      super(reason);
      this.error = error;
    }
  }
  return {
    Meteor: {
      Error: MockError,
      connection: {
        subscribe: vi.fn(() => ({ ready: vi.fn(() => true), stop: vi.fn() })),
        applyAsync: vi.fn(),
        setUserId: vi.fn(),
        userId: vi.fn(),
      }
    }
  };
});

// Mock the Meteor OAuth package
vi.mock('meteor/oauth', () => ({
  OAuth: {
    _retrieveCredentialSecret: vi.fn(),
    getDataAfterRedirect: vi.fn(),
  },
}));

// Mock the base class ensuring it fulfills OAuthAuthMixinRequirements
class MockAccountsBase {
  public callLoginMethod = vi.fn();
  public _pageLoadLogin = vi.fn();
  public LoginCancelledError = class extends Error {
    public numericError = 0x8acdc2f;
    constructor(message?: string) {
      super(message);
    }
  };
  
  // Satisfy ServiceConfiguration dependencies
  public loginServiceConfiguration = {} as any;
  public throwConfigError(serviceName?: string): never {
    throw new Error(`Mock config error for ${serviceName}`);
  }
}

const TestAccountsClient = OAuthAuthMixin(MockAccountsBase);

describe('OAuthAuthMixin (Client)', () => {
  let client: InstanceType<typeof TestAccountsClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    client = new TestAccountsClient();
  });

  describe('Service Registration', () => {
    it('registers and unregisters services', () => {
      client.oauth.registerService('github');
      expect(client.oauth.serviceNames()).toContain('github');

      expect(() => client.oauth.registerService('github')).toThrowError('Duplicate service: github');

      client.oauth.unregisterService('github');
      expect(client.oauth.serviceNames()).not.toContain('github');
    });
  });

  describe('tryLoginAfterPopupClosed', () => {
    it('calls login method immediately if secret is available', () => {
      vi.mocked(OAuth)._retrieveCredentialSecret.mockReturnValueOnce('mock-secret');

      client.oauth.tryLoginAfterPopupClosed('mock-token');

      expect(client.callLoginMethod).toHaveBeenCalledWith(
        expect.objectContaining({
          methodArguments: [{ oauth: { credentialToken: 'mock-token', credentialSecret: 'mock-secret' } }],
        })
      );
    });

    it('polls if secret is not immediately available', () => {
      (OAuth._retrieveCredentialSecret as any)
        .mockReturnValueOnce(null) // Immediate check fails
        .mockReturnValueOnce('mock-secret-delayed'); // Polled check succeeds

      client.oauth.tryLoginAfterPopupClosed('mock-token');
      
      expect(client.callLoginMethod).not.toHaveBeenCalled();
      
      // Advance time to trigger setInterval
      vi.advanceTimersByTime(250);

      expect(client.callLoginMethod).toHaveBeenCalledWith(
        expect.objectContaining({
          methodArguments: [{ oauth: { credentialToken: 'mock-token', credentialSecret: 'mock-secret-delayed' } }],
        })
      );
    });
  });

  describe('processOAuthRedirect', () => {
    it('calls login method and pageLoadLogin if redirect data is present', () => {
      (OAuth.getDataAfterRedirect as any).mockReturnValueOnce({
        loginService: 'google',
        credentialToken: 'redirect-token',
        credentialSecret: 'redirect-secret',
      });

      client.processOAuthRedirect();

      expect(client.callLoginMethod).toHaveBeenCalledWith(
        expect.objectContaining({
          methodArguments: [{ oauth: { credentialToken: 'redirect-token', credentialSecret: 'redirect-secret' } }],
        })
      );

      // Simulate a successful login callback
      const callArgs = (client.callLoginMethod as any).mock.calls[0][0];
      callArgs.userCallback(undefined);

      expect(client._pageLoadLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'google',
          allowed: true,
          error: undefined,
          methodName: 'login',
        })
      );
    });

    it('does nothing if no redirect data is found', () => {
      (OAuth.getDataAfterRedirect as any).mockReturnValueOnce(null);
      
      client.processOAuthRedirect();
      
      expect(client.callLoginMethod).not.toHaveBeenCalled();
    });
  });
});