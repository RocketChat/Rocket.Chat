import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';
import type { Accounts } from 'meteor/accounts-base';

export type Constructor<T = {}> = new (...args: any[]) => T;

// Now it expects both core methods AND the ServiceConfiguration methods
export interface OAuthAuthMixinRequirements {
  callLoginMethod(options: Accounts.LoginMethodOptions): void;
  _pageLoadLogin(attemptInfo: any): void;
  LoginCancelledError: new (message?: string) => Error & { numericError?: number };

  // From ServiceConfigurationMixin
  loginServiceConfiguration: any;
  throwConfigError(serviceName?: string): never;
}

export function OAuthAuthMixin<TBase extends Constructor<OAuthAuthMixinRequirements>>(Base: TBase) {
  return class extends Base {
    private _oauthServices = new Set<string>();

    public oauth = {
      registerService: (name: string): void => {
        if (this._oauthServices.has(name)) {
          throw new Error(`Duplicate service: ${name}`);
        }
        this._oauthServices.add(name);
      },

      unregisterService: (name: string): void => {
        if (!this._oauthServices.has(name)) {
          throw new Error(`Service not found: ${name}`);
        }
        this._oauthServices.delete(name);
      },

      serviceNames: (): string[] => {
        return Array.from(this._oauthServices);
      },

      tryLoginAfterPopupClosed: (
        credentialToken: string,
        callback?: (err?: Error | unknown) => void,
        timeout: number = 1000
      ): void => {
        const startTime = Date.now();
        let calledOnce = false;
        let intervalId: ReturnType<typeof setInterval>;

        const checkForCredentialSecret = (clearIntervalFlag = false) => {
          const credentialSecret = OAuth._retrieveCredentialSecret(credentialToken);

          if (!calledOnce && (credentialSecret || clearIntervalFlag)) {
            calledOnce = true;
            clearInterval(intervalId);
            this.callLoginMethod({
              methodArguments: [{ oauth: { credentialToken, credentialSecret } }],
              userCallback: callback ? (err: any) => callback(this._convertError(err)) : () => { },
            });
          } else if (clearIntervalFlag) {
            clearInterval(intervalId);
          }
        };

        // Check immediately
        checkForCredentialSecret();

        // Then check on an interval (localStorage might take a moment to sync from the popup)
        intervalId = setInterval(() => {
          if (Date.now() - startTime > timeout) {
            checkForCredentialSecret(true);
          } else {
            checkForCredentialSecret();
          }
        }, 250);
      },

      credentialRequestCompleteHandler: (callback?: ((err?: Error | unknown) => void) | undefined) => {
        return (credentialTokenOrError: string | Error) => {
          if (credentialTokenOrError && credentialTokenOrError instanceof Error) {
            if (callback) callback(credentialTokenOrError);
          } else {
            this.oauth.tryLoginAfterPopupClosed(credentialTokenOrError as string, callback);
          }
        };
      }
    };

    private _convertError(err: any): Error | any {
      if (
        err &&
        err instanceof Meteor.Error &&
        err.error === new this.LoginCancelledError().numericError
      ) {
        return new this.LoginCancelledError(err.reason);
      }
      return err;
    }

    /**
     * Initializes the OAuth redirect flow.
     * This replaces the legacy Meteor.startup() block. Call this once when your app mounts.
     */
    public processOAuthRedirect(): void {
      const oauthData = OAuth.getDataAfterRedirect();
      if (!oauthData) return;

      const methodName = 'login';
      const { credentialToken, credentialSecret, loginService } = oauthData;
      const methodArguments = [{ oauth: { credentialToken, credentialSecret } }];

      this.callLoginMethod({
        methodArguments,
        userCallback: (err: any) => {
          const convertedErr = this._convertError(err);

          this._pageLoadLogin({
            type: loginService,
            allowed: !convertedErr,
            error: convertedErr,
            methodName,
            methodArguments,
          });
        }
      });
    }
  };
}
