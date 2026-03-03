import { describe, it, expect, vi, afterEach } from 'vitest';
import { loginWithFacebook, type LoginWithFacebookOptions } from './facebook';
import { Accounts } from 'meteor/accounts-base';
import { Facebook } from 'meteor/facebook-oauth';

// Mock the underlying dependencies
vi.mock('meteor/accounts-base', () => ({
  Accounts: {
    oauth: {
      registerService: vi.fn(),
      credentialRequestCompleteHandler: vi.fn((cb) => cb), // Pass-through mock
    },
    registerClientLoginFunction: vi.fn(),
    applyLoginFunction: vi.fn(),
  }
}));

vi.mock('meteor/facebook-oauth', () => ({
  Facebook: {
    requestCredential: vi.fn(),
  }
}));

describe('Accounts Facebook (Frontend)', () => {
  // CHANGED: Use afterEach instead of beforeEach.
  // This preserves the module-level execution calls triggered by the `import`
  // so the first test can assert them, while still keeping subsequent tests clean.
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('registers the facebook service on initialization', () => {
    // The module scope execution should have called this
    expect(Accounts.oauth.registerService).toHaveBeenCalledWith('facebook');
    expect(Accounts.registerClientLoginFunction).toHaveBeenCalledWith('facebook', loginWithFacebook);
  });

  it('calls Facebook.requestCredential with options and a callback', () => {
    const options: LoginWithFacebookOptions = { requestPermissions: ['email'] };
    const callback = vi.fn();

    loginWithFacebook(options, callback);

    expect(Accounts.oauth.credentialRequestCompleteHandler).toHaveBeenCalledWith(callback);
    expect(Facebook.requestCredential).toHaveBeenCalledWith(options, callback);
  });

  it('handles being called with just a callback and no options', () => {
    const callback = vi.fn();

    loginWithFacebook(callback);

    expect(Accounts.oauth.credentialRequestCompleteHandler).toHaveBeenCalledWith(callback);
    expect(Facebook.requestCredential).toHaveBeenCalledWith(undefined, callback);
  });
});