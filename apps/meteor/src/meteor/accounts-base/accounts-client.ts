import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { DDP } from 'meteor/ddp-client';
import { AccountsCommon, type AccountsConfigOptions } from './accounts-common.ts';

export type PageLoadLoginAttemptInfo = {
  type: string;
  allowed: boolean;
  error?: Error | any;
  methodName: string;
  methodArguments: any[];
};

export class AccountsClient extends AccountsCommon {
  private _loggingIn = new ReactiveVar(false);
  private _loginCount = 0; // Tracks overlapping login attempts (e.g. REST + WS)
  private _loggingOut = new ReactiveVar(false);
  private _loginServicesHandle: any;
  private _pageLoadLoginCallbacks: ((info: PageLoadLoginAttemptInfo) => void)[] = [];
  private _pageLoadLoginAttemptInfo: PageLoadLoginAttemptInfo | null = null;
  private _loginFuncs: Record<string, Function> = {};
  private _loginCallbacksCalled = false;
  private _autoLoginEnabled = true;
  private _accountsCallbacks: Record<string, Function> = {};
  private _reconnectStopper?: any;
  private _lastLoginTokenWhenPolled: string | null = null;
  private _pollIntervalTimer?: ReturnType<typeof setInterval>;

  private _userIdDep?: any;

  public savedHash: string;
  public storageLocation!: Storage;

  public LOGIN_TOKEN_KEY!: string;
  public LOGIN_TOKEN_EXPIRES_KEY!: string;
  public USER_ID_KEY!: string;

  constructor(options: AccountsConfigOptions = {}) {
    super(options);

    this.savedHash = window.location.hash;
    this._initUrlMatching();
    this.initStorageLocation(options);
    this._initLocalStorageKeys();

    setTimeout(() => {
      this._loginServicesHandle = this.connection?.subscribe("meteor.loginServiceConfiguration");

      // RESTORE REACTIVITY FOR DDP USER ID
      // Rocket.Chat's UI heavily relies on Accounts.connection.userId() being a reactive
      // data source to populate its internal stores and flip endpoints from Anon to Auth.
      if (this.connection) {
        const originalSetUserId = this.connection.setUserId.bind(this.connection);
        const originalUserId = this.connection.userId.bind(this.connection);

        const userIdDep = new Tracker.Dependency();
        this._userIdDep = userIdDep;

        this.connection.userId = () => {
          userIdDep.depend();
          return originalUserId();
        };

        this.connection.setUserId = (userId: string | null) => {
          const current = originalUserId();
          if (current !== userId) {
            originalSetUserId(userId);
            // PREVENT nosub ERRORS:
            // Do not trigger the reactivity until all pending login methods finish!
            // If the WebSocket login is still running, delaying this prevents the UI
            // from prematurely subscribing to authenticated streams.
            if (!this.loggingIn()) {
              userIdDep.changed();
            }
          }
        };
      }

      this._initLocalStorageState();
    }, 0);
  }

  public initStorageLocation(options?: AccountsConfigOptions): void {
    const useSession = options?.clientStorage === 'session';
    this.storageLocation = useSession ? window.sessionStorage : window.localStorage;
  }

  public override config(options: AccountsConfigOptions): void {
    super.config(options);
    this.initStorageLocation(options);
  }

  public override userId(): string | null {
    return this.connection?.userId() || null;
  }

  public _setLoggingIn(x: boolean): void {
    const wasLoggingIn = this._loginCount > 0;

    if (x) {
      this._loginCount++;
    } else {
      this._loginCount = Math.max(0, this._loginCount - 1);
    }

    const isLoggingIn = this._loginCount > 0;
    this._loggingIn.set(isLoggingIn);

    // If we just finished all pending logins (e.g. REST + WebSocket are both done),
    // trigger the userId dependency so the UI can finally subscribe to streams securely!
    if (wasLoggingIn && !isLoggingIn && this._userIdDep) {
      this._userIdDep.changed();
    }
  }

  public loggingIn(): boolean {
    return this._loggingIn.get();
  }

  public loggingOut(): boolean {
    return this._loggingOut.get();
  }

  public registerClientLoginFunction(funcName: string, func: Function): void {
    if (this._loginFuncs[funcName]) {
      throw new Error(`${funcName} has been defined already`);
    }
    this._loginFuncs[funcName] = func;
  }

  public callLoginFunction(funcName: string, ...funcArgs: any[]): any {
    if (!this._loginFuncs[funcName]) {
      throw new Error(`${funcName} was not defined`);
    }
    return this._loginFuncs[funcName].apply(this, funcArgs);
  }

  public applyLoginFunction(funcName: string, funcArgs: any[]): any {
    if (!this._loginFuncs[funcName]) {
      throw new Error(`${funcName} was not defined`);
    }
    return this._loginFuncs[funcName].apply(this, funcArgs);
  }

  public logout(callback?: (err?: Error) => void): void {
    this._loggingOut.set(true);

    this.connection?.applyAsync('logout', [], { wait: true })
      .then(() => {
        this._loggingOut.set(false);
        this._loginCallbacksCalled = false;
        this.makeClientLoggedOut();
        if (callback) callback();
      })
      .catch((e: Error) => {
        this._loggingOut.set(false);
        if (callback) callback(e);
      });
  }

  public logoutAllClients(callback?: (err?: Error) => void): void {
    this._loggingOut.set(true);

    this.connection?.applyAsync('logoutAllClients', [], { wait: true })
      .then(() => {
        this._loggingOut.set(false);
        this._loginCallbacksCalled = false;
        this.makeClientLoggedOut();
        if (callback) callback();
      })
      .catch((e: Error) => {
        this._loggingOut.set(false);
        if (callback) callback(e);
      });
  }

  public logoutOtherClients(callback?: (err?: Error) => void): void {
    this.connection?.applyAsync('getNewToken', [], { wait: true })
      .then((result: any) => {
        const userId = this.userId();
        if (userId) {
          this._storeLoginToken(userId, result.token, result.tokenExpires);
        }
        return this.connection?.applyAsync('removeOtherTokens', [], { wait: true });
      })
      .then(() => {
        if (callback) callback();
      })
      .catch((err: Error) => {
        if (callback) callback(err);
      });
  }

  public callLoginMethod({ userCallback = () => null, ...options }: {
    methodName?: string;
    methodArguments?: any[] | undefined;
    _suppressLoggingIn?: boolean;
    validateResult?: (result: any) => void;
    userCallback?: ((err?: Error, result?: any) => void) | undefined;
  }): void {
    const opts = {
      methodName: 'login',
      methodArguments: [{}],
      _suppressLoggingIn: false,
      validateResult: () => null,
      userCallback,
      ...options,
    };

    let called = false;

    const loginCallbacks = ({ error, loginDetails }: any) => {
      if (!called) {
        called = true;
        if (!error) {
          this._onLoginHook.forEach(callback => {
            callback(loginDetails);
            return true;
          });
          this._loginCallbacksCalled = true;
        } else {
          this._loginCallbacksCalled = false;
          this._onLoginFailureHook.forEach(callback => {
            callback({ error });
            return true;
          });
        }
        opts.userCallback(error, loginDetails);
      }
    };

    let reconnected = false;
    let didIncrementLoggingIn = false;

    if (!opts._suppressLoggingIn) {
      this._setLoggingIn(true);
      didIncrementLoggingIn = true;
    }

    const releaseLoggingIn = () => {
      if (didIncrementLoggingIn) {
        this._setLoggingIn(false);
        didIncrementLoggingIn = false;
      }
    };

    const onResultReceived = (err: any, result: any) => {
      if (!err && result && result.token) {
        if (this._reconnectStopper) {
          this._reconnectStopper.stop();
        }

        this._reconnectStopper = DDP.onReconnect((conn: any) => {
          if (conn !== this.connection) return;

          reconnected = true;
          const storedToken = this._storedLoginToken();

          if (storedToken) {
            result = { token: storedToken, tokenExpires: this._storedLoginTokenExpires() };
          }

          if (!result.tokenExpires) {
            result.tokenExpires = this._tokenExpiration(new Date());
          }

          if (this._tokenExpiresSoon(result.tokenExpires)) {
            this.makeClientLoggedOut();
          } else {
            this.callLoginMethod({
              methodArguments: [{ resume: result.token }],
              _suppressLoggingIn: true,
              userCallback: (error, loginDetails) => {
                const storedTokenNow = this._storedLoginToken();
                if (error && storedTokenNow && storedTokenNow === result.token) {
                  this.makeClientLoggedOut();
                }
                loginCallbacks({ error, loginDetails });
              }
            });
          }
        });
      }
    };

    const loggedInAndDataReadyCallback = (error: any, result: any) => {
      if (reconnected) return;

      if (error || !result) {
        loginCallbacks({ error: error || new Error(`No result from call to ${opts.methodName}`) });
        releaseLoggingIn();
        return;
      }

      try {
        opts.validateResult(result);
      } catch (e) {
        loginCallbacks({ error: e });
        releaseLoggingIn();
        return;
      }

      this.makeClientLoggedIn(result.id, result.token, result.tokenExpires);

      loginCallbacks({ loginDetails: result });

      // Free this specific login lock. If another login method is still
      // pending (like the WS login), the UI will continue to show loading
      // and streams will safely hold off until it finishes!
      releaseLoggingIn();
    };

    this.connection?.applyAsync(
      opts.methodName,
      opts.methodArguments,
      { wait: true, onResultReceived },
      loggedInAndDataReadyCallback
    );
  }

  public makeClientLoggedOut(): void {
    if ((this.connection as any)?._userId) {
      this._onLogoutHook.forEach(callback => {
        callback();
        return true;
      });
    }
    this._unstoreLoginToken();
    if (this.connection) this.connection.setUserId(null);
    if (this._reconnectStopper) this._reconnectStopper.stop();
  }

  public makeClientLoggedIn(userId: string, token: string, tokenExpires: string | Date): void {
    this._storeLoginToken(userId, token, tokenExpires);
    this.connection?.setUserId(userId);
  }

  public loginServicesConfigured(): boolean {
    return this._loginServicesHandle ? this._loginServicesHandle.ready() : false;
  }

  public onPageLoadLogin(f: (info: PageLoadLoginAttemptInfo) => void): void {
    if (this._pageLoadLoginAttemptInfo) {
      f(this._pageLoadLoginAttemptInfo);
    } else {
      this._pageLoadLoginCallbacks.push(f);
    }
  }

  public _pageLoadLogin(attemptInfo: PageLoadLoginAttemptInfo): void {
    if (this._pageLoadLoginAttemptInfo) {
      console.warn('Ignoring unexpected duplicate page load login attempt info');
      return;
    }

    this._pageLoadLoginCallbacks.forEach(callback => callback(attemptInfo));
    this._pageLoadLoginCallbacks = [];
    this._pageLoadLoginAttemptInfo = attemptInfo;
  }

  protected override _startupCallback(callback: Function): void {
    if (this._loginCallbacksCalled) {
      setTimeout(() => callback({ type: 'resume' }), 0);
    }
  }

  public loginWithToken(token: string, callback?: (err?: Error) => void): void {
    this.callLoginMethod({
      methodArguments: [{ resume: token }],
      userCallback: callback
    });
  }

  private _storeLoginToken(userId: string, token: string, tokenExpires: string | Date): void {
    this.storageLocation.setItem(this.USER_ID_KEY, userId);
    this.storageLocation.setItem(this.LOGIN_TOKEN_KEY, token);

    if (!tokenExpires) {
      tokenExpires = this._tokenExpiration(new Date());
    }

    this.storageLocation.setItem(this.LOGIN_TOKEN_EXPIRES_KEY, String(tokenExpires));
    this._lastLoginTokenWhenPolled = token;
  }

  public _unstoreLoginToken(): void {
    this.storageLocation.removeItem(this.USER_ID_KEY);
    this.storageLocation.removeItem(this.LOGIN_TOKEN_KEY);
    this.storageLocation.removeItem(this.LOGIN_TOKEN_EXPIRES_KEY);
    this._lastLoginTokenWhenPolled = null;
  }

  private _storedLoginToken(): string | null {
    return this.storageLocation.getItem(this.LOGIN_TOKEN_KEY);
  }

  private _storedLoginTokenExpires(): string | null {
    return this.storageLocation.getItem(this.LOGIN_TOKEN_EXPIRES_KEY);
  }

  private _storedUserId(): string | null {
    return this.storageLocation.getItem(this.USER_ID_KEY);
  }

  private _unstoreLoginTokenIfExpiresSoon(): void {
    const tokenExpires = this._storedLoginTokenExpires();
    if (tokenExpires && this._tokenExpiresSoon(new Date(tokenExpires))) {
      this._unstoreLoginToken();
    }
  }

  private _initLocalStorageKeys(): void {
    this.LOGIN_TOKEN_KEY = "Meteor.loginToken";
    this.LOGIN_TOKEN_EXPIRES_KEY = "Meteor.loginTokenExpires";
    this.USER_ID_KEY = "Meteor.userId";
  }

  private _initLocalStorageState(): void {
    if (this._autoLoginEnabled) {
      this._unstoreLoginTokenIfExpiresSoon();
      const token = this._storedLoginToken();
      if (token) {
        const userId = this._storedUserId();
        if (userId) this.connection?.setUserId(userId);

        this.loginWithToken(token, (err) => {
          if (err) {
            console.error(`Error logging in with token: ${err}`);
            this.makeClientLoggedOut();
          }

          this._pageLoadLogin({
            type: "resume",
            allowed: !err,
            error: err,
            methodName: "login",
            methodArguments: [{ resume: token }]
          });
        });
      }
    }

    this._lastLoginTokenWhenPolled = this._storedLoginToken();

    if (this._pollIntervalTimer) clearInterval(this._pollIntervalTimer);

    this._pollIntervalTimer = setInterval(() => {
      this._pollStoredLoginToken();
    }, 3000);
  }

  private _pollStoredLoginToken(): void {
    if (!this._autoLoginEnabled) return;

    const currentLoginToken = this._storedLoginToken();

    if (this._lastLoginTokenWhenPolled !== currentLoginToken) {
      if (currentLoginToken) {
        this.loginWithToken(currentLoginToken, (err) => {
          if (err) this.makeClientLoggedOut();
        });
      } else {
        this.logout();
      }
    }

    this._lastLoginTokenWhenPolled = currentLoginToken;
  }

  private _initUrlMatching(): void {
    this._autoLoginEnabled = true;
    this._accountsCallbacks = {};
  }

  public onResetPasswordLink(callback: Function): void {
    this._accountsCallbacks["reset-password"] = callback;
  }

  public onEmailVerificationLink(callback: Function): void {
    this._accountsCallbacks["verify-email"] = callback;
  }

  public onEnrollmentLink(callback: Function): void {
    this._accountsCallbacks["enroll-account"] = callback;
  }
}
