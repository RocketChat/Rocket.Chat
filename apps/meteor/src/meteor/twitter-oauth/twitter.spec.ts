import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Twitter, type TwitterRequestCredentialOptions } from './twitter';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { OAuth } from 'meteor/oauth';
import { Meteor } from 'meteor/meteor'

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
    _stateParam: vi.fn(() => 'mocked-state'),
    launchLogin: vi.fn(),
  }
}));

vi.mock('meteor/meteor', () => ({
  Meteor: {
    absoluteUrl: vi.fn((path: string) => `http://localhost:3000/${path}`),
  }
}));

describe('Twitter OAuth (Frontend)', () => {
  beforeEach(() => {
    // Default happy path config
    vi.mocked(ServiceConfiguration.configurations.findOne).mockReturnValue({
      service: 'twitter',
      consumerKey: 'test-consumer-key'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return an error if the service is not configured', () => {
    vi.mocked(ServiceConfiguration.configurations.findOne).mockReturnValue(null);
    const callback = vi.fn();

    Twitter.requestCredential({}, callback);

    expect(callback).toHaveBeenCalledWith(new Error("Service not configured"));
    expect(OAuth.launchLogin).not.toHaveBeenCalled();
  });

  it('generates the correct step 1 OAuth request token URL and launches login', () => {
    Twitter.requestCredential({});

    expect(OAuth._loginStyle).toHaveBeenCalledWith('twitter', { service: 'twitter', consumerKey: 'test-consumer-key' }, {});
    expect(OAuth._stateParam).toHaveBeenCalledWith('popup', 'mocked-secret', undefined);
    expect(Meteor.absoluteUrl).toHaveBeenCalledWith('_oauth/twitter/?requestTokenAndRedirect=true&state=mocked-state');
    
    // Assert launchLogin was called with correct arguments
    expect(OAuth.launchLogin).toHaveBeenCalledWith({
      loginService: 'twitter',
      loginStyle: 'popup',
      loginUrl: 'http://localhost:3000/_oauth/twitter/?requestTokenAndRedirect=true&state=mocked-state',
      credentialRequestCompleteCallback: undefined,
      credentialToken: 'mocked-secret',
    });
  });

  it('appends additional permitted parameters like force_login and screen_name', () => {
    const options: TwitterRequestCredentialOptions = {
      force_login: true,
      screen_name: 'meteorjs'
    };

    Twitter.requestCredential(options);

    // Verify the URL was generated with the extra query parameters
    expect(Meteor.absoluteUrl).toHaveBeenCalledWith(
      '_oauth/twitter/?requestTokenAndRedirect=true&state=mocked-state&force_login=true&screen_name=meteorjs'
    );
  });
});