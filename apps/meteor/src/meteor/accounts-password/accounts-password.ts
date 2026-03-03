import { Meteor } from 'meteor/meteor';
import { SHA256 } from 'meteor/sha';

// Generic Constructor type for Mixins
export type Constructor<T = {}> = new (...args: any[]) => T;

export type UserSelector = string | { username: string } | { email: string } | { id: string };

export type CreateUserOptions = {
  username?: string;
  email?: string;
  password?: string;
  profile?: Record<string, any>;
  [key: string]: any;
};

export const hashPassword = (password: string) => ({
  digest: SHA256(password),
  algorithm: 'sha-256' as const,
});

const reportError = (error: Error | unknown, callback?: (error?: Error | unknown, result?: any) => void): void => {
  if (callback) {
    callback(error);
  } else {
    throw error;
  }
};

/**
 * 1. Define exactly what this mixin needs from its base class.
 */
export interface PasswordAuthMixinRequirements {
  callLoginMethod(options: {
    methodName?: string;
    methodArguments?: any[];
    _suppressLoggingIn?: boolean;
    validateResult?: (result: any) => void;
    userCallback?: ((err?: Error | unknown, result?: any) => void) | undefined;
  }): void;

  connection?: {
    applyAsync(name: string, args: any[]): Promise<any>;
  };
}

/**
 * 2. Constrain TBase to only require those specific methods/properties.
 */
export function PasswordAuthMixin<TBase extends Constructor<PasswordAuthMixinRequirements>>(Base: TBase) {
  return class extends Base {

    _hashPassword = hashPassword;

    private _internalLoginWithPassword(
      selector: UserSelector,
      password: string,
      code?: string,
      callback?: (error?: Error | unknown, result?: any) => void
    ): UserSelector {
      let formattedSelector: any = selector;

      if (typeof selector === 'string') {
        if (!selector.includes('@')) {
          formattedSelector = { username: selector };
        } else {
          formattedSelector = { email: selector };
        }
      }

      this.callLoginMethod({
        methodArguments: [
          {
            user: formattedSelector,
            password: hashPassword(password),
            ...(code ? { code } : {}),
          },
        ],
        userCallback: (error: any, result: any) => {
          if (error) {
            reportError(error, callback);
          } else if (callback) {
            callback(undefined, result);
          }
        },
      });

      return formattedSelector;
    }

    public loginWithPassword(
      selector: UserSelector,
      password: string,
      callback?: (error?: Error | unknown) => void
    ): void {
      this._internalLoginWithPassword(selector, password, undefined, callback);
    }

    public loginWithPasswordAnd2faCode(
      selector: UserSelector,
      password: string,
      code: string,
      callback?: (error?: Error | unknown) => void
    ): void {
      if (code == null || typeof code !== 'string' || !code) {
        throw new Error('token is required to use loginWithPasswordAnd2faCode and must be a string');
      }
      this._internalLoginWithPassword(selector, password, code, callback);
    }

    public createUser(
      options: CreateUserOptions,
      callback?: (error?: Error | unknown) => void
    ): void {
      const opts = { ...options };

      if (typeof opts.password !== 'string') {
        throw new Error('options.password must be a string');
      }
      if (!opts.password) {
        return reportError(new Error('Password may not be empty'), callback);
      }

      opts.password = hashPassword(opts.password) as any;

      this.callLoginMethod({
        methodName: 'createUser',
        methodArguments: [opts],
        userCallback: callback,
      });
    }

    public createUserAsync(options: CreateUserOptions): Promise<void> {
      return new Promise((resolve, reject) => {
        this.createUser(options, (e) => {
          if (e) {
            reject(e);
          } else {
            resolve();
          }
        });
      });
    }

    public changePassword(
      oldPassword: string | null | undefined,
      newPassword: string,
      callback?: (error?: Error | unknown) => void
    ): void {
      if (!Meteor.user()) {
        return reportError(new Error('Must be logged in to change password.'), callback);
      }

      if (typeof newPassword !== 'string') {
        return reportError(new Error('Password must be a string'), callback);
      }

      if (!newPassword) {
        return reportError(new Error('Password may not be empty'), callback);
      }

      this.connection?.applyAsync(
        'changePassword',
        [oldPassword ? hashPassword(oldPassword) : null, hashPassword(newPassword)]
      )
        .then((result: any) => {
          if (!result) {
            reportError(new Error('No result from changePassword.'), callback);
          } else if (callback) {
            callback();
          }
        })
        .catch((error: Error) => reportError(error, callback));
    }

    public forgotPassword(
      options: { email: string },
      callback?: (error?: Error | unknown) => void
    ): void {
      if (!options.email) {
        return reportError(new Error('Must pass options.email'), callback);
      }

      this.connection?.applyAsync('forgotPassword', [options])
        .then(() => { if (callback) callback(); })
        .catch((error: Error) => { if (callback) callback(error); });
    }

    public resetPassword(
      token: string,
      newPassword: string,
      callback?: (error?: Error | unknown) => void
    ): void {
      if (typeof token !== 'string') return reportError(new Error('Token must be a string'), callback);
      if (typeof newPassword !== 'string') return reportError(new Error('Password must be a string'), callback);
      if (!newPassword) return reportError(new Error('Password may not be empty'), callback);

      this.callLoginMethod({
        methodName: 'resetPassword',
        methodArguments: [token, hashPassword(newPassword)],
        userCallback: callback,
      });
    }

    public verifyEmail(
      token: string,
      callback?: (error?: Error | unknown) => void
    ): void {
      if (!token) return reportError(new Error('Need to pass token'), callback);

      this.callLoginMethod({
        methodName: 'verifyEmail',
        methodArguments: [token],
        userCallback: callback,
      });
    }
  };
}
