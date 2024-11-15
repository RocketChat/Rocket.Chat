import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { Configuration } from 'meteor/service-configuration';
import { DDP } from 'meteor/ddp';

export interface URLS {
  resetPassword: (token: string) => string;
  verifyEmail: (token: string) => string;
  enrollAccount: (token: string) => string;
}

export interface EmailFields {
  from?: ((user: Meteor.User) => string) | undefined;
  subject?: ((user: Meteor.User) => string) | undefined;
  text?: ((user: Meteor.User, url: string) => string) | undefined;
  html?: ((user: Meteor.User, url: string) => string) | undefined;
}

export interface AccountsClientOptions {
  connection?: DDP.DDPStatic;
  ddpUrl?: string;
}

export class AccountsClient {
  constructor(options?: AccountsClientOptions);
  connection: DDP.DDPStatic;
}

export namespace Accounts {
  var urls: URLS;

  function user(options?: {
    fields?: Mongo.FieldSpecifier | undefined;
  }): Meteor.User | null;

  function userAsync(options?: {
    fields?: Mongo.FieldSpecifier | undefined;
  }): Promise<Meteor.User | null>;

  function userId(): string | null;

  function createUser(
    options: {
      username?: string | undefined;
      email?: string | undefined;
      password?: string | undefined;
      profile?: Meteor.UserProfile | undefined;
    },
    callback?: (error?: Error | Meteor.Error | Meteor.TypedError) => void
  ): Promise<string>;

  function createUserAsync(
    options: {
      username?: string | undefined;
      email?: string | undefined;
      password?: string | undefined;
      profile?: Meteor.UserProfile | undefined;
    },
    callback?: (error?: Error | Meteor.Error | Meteor.TypedError) => void
  ): Promise<string>;

  function createUserVerifyingEmail(
    options: {
      username?: string | undefined;
      email?: string | undefined;
      password?: string | undefined;
      profile?: Meteor.UserProfile | undefined;
    },
    callback?: (error?: Error | Meteor.Error | Meteor.TypedError) => void
  ): Promise<string>;

  function config(options: {
    sendVerificationEmail?: boolean | undefined;
    forbidClientAccountCreation?: boolean | undefined;
    restrictCreationByEmailDomain?: string | Function | undefined;
    loginExpiration?: number | undefined;
    loginExpirationInDays?: number | undefined;
    oauthSecretKey?: string | undefined;
    passwordResetTokenExpiration?: number | undefined;
    passwordResetTokenExpirationInDays?: number | undefined;
    passwordEnrollTokenExpiration?: number | undefined;
    passwordEnrollTokenExpirationInDays?: number | undefined;
    ambiguousErrorMessages?: boolean | undefined;
    bcryptRounds?: number | undefined;
    defaultFieldSelector?: { [key: string]: 0 | 1 } | undefined;
    collection?: string | undefined;
    loginTokenExpirationHours?: number | undefined;
    tokenSequenceLength?: number | undefined;
    clientStorage?: 'session' | 'local';
  }): void;

  function onLogin(
    func: Function
  ): {
    stop: () => void;
  };

  function onLoginFailure(
    func: Function
  ): {
    stop: () => void;
  };

  var loginServiceConfiguration: Mongo.Collection<Configuration>

  function loginServicesConfigured(): boolean;

  function onPageLoadLogin(func: Function): void;
}

export namespace Accounts {
  function changePassword(
    oldPassword: string,
    newPassword: string,
    callback?: (error?: Error | Meteor.Error | Meteor.TypedError) => void
  ): Promise<void>;

  function forgotPassword(
    options: { email?: string | undefined },
    callback?: (error?: Error | Meteor.Error | Meteor.TypedError) => void
  ): Promise<void>;

  function resetPassword(
    token: string,
    newPassword: string,
    callback?: (error?: Error | Meteor.Error | Meteor.TypedError) => void
  ): Promise<void>;

  function verifyEmail(
    token: string,
    callback?: (error?: Error | Meteor.Error | Meteor.TypedError) => void
  ): Promise<void>;

  function onEmailVerificationLink(callback: Function): void;

  function onEnrollmentLink(callback: Function): void;

  function onResetPasswordLink(callback: Function): void;

  function loggingIn(): boolean;

  function loggingOut(): boolean;

  function logout(
    callback?: (error?: Error | Meteor.Error | Meteor.TypedError) => void
  ): Promise<void>;

  function logoutOtherClients(
    callback?: (error?: Error | Meteor.Error | Meteor.TypedError) => void
  ): Promise<void>;

  type PasswordSignupField = 'USERNAME_AND_EMAIL' | 'USERNAME_AND_OPTIONAL_EMAIL' | 'USERNAME_ONLY' | 'EMAIL_ONLY';
  type PasswordlessSignupField = 'USERNAME_AND_EMAIL' | 'EMAIL_ONLY';

  var ui: {
    config(options: {
      requestPermissions?: Record<string, string[]> | undefined;
      requestOfflineToken?: Record<'google', boolean> | undefined;
      forceApprovalPrompt?: Record<'google', boolean> | undefined;
      passwordSignupFields?: PasswordSignupField | PasswordSignupField[] | undefined;
      passwordlessSignupFields?: PasswordlessSignupField | PasswordlessSignupField[] | undefined;
    }): void;
  };
}

export interface Header {
  [id: string]: string;
}

export interface EmailTemplates {
  from: string;
  siteName: string;
  headers?: Header | undefined;
  resetPassword: EmailFields;
  enrollAccount: EmailFields;
  verifyEmail: EmailFields;
}

export namespace Accounts {
  var emailTemplates: EmailTemplates;

  function addEmailAsync(userId: string, newEmail: string, verified?: boolean): Promise<void>;

  function removeEmail(userId: string, email: string): Promise<void>;

  function onCreateUser(
    func: (options: { profile?: {} | undefined }, user: Meteor.User) => void
  ): void;

  function findUserByEmail(
    email: string,
    options?: { fields?: Mongo.FieldSpecifier | undefined }
  ): Promise<Meteor.User | null | undefined>;

  function findUserByUsername(
    username: string,
    options?: { fields?: Mongo.FieldSpecifier | undefined }
  ): Promise<Meteor.User | null | undefined>;

  function sendEnrollmentEmail(
    userId: string,
    email?: string,
    extraTokenData?: Record<string, unknown>,
    extraParams?: Record<string, unknown>
  ): Promise<void>;

  function sendResetPasswordEmail(
    userId: string,
    email?: string,
    extraTokenData?: Record<string, unknown>,
    extraParams?: Record<string, unknown>
  ): Promise<void>;

  function sendVerificationEmail(
    userId: string,
    email?: string,
    extraTokenData?: Record<string, unknown>,
    extraParams?: Record<string, unknown>
  ): Promise<void>;

  function setUsername(userId: string, newUsername: string): Promise<void>;

  function setPasswordAsync(
    userId: string,
    newPassword: string,
    options?: { logout?: boolean | undefined }
  ): Promise<void>;

  function validateNewUser(func: Function): boolean;

  function validateLoginAttempt(
    func: Function
  ): {
    stop: () => void;
  };

  function _hashPassword(
    password: string
  ): { digest: string; algorithm: string };

  interface IValidateLoginAttemptCbOpts {
    type: string;
    allowed: boolean;
    error: Meteor.Error;
    user: Meteor.User;
    connection: Meteor.Connection;
    methodName: string;
    methodArguments: any[];
  }
}

export namespace Accounts {
  function onLogout(func: Function): void;
}

export namespace Accounts {
  function onLogout(
    func: (options: {
      user: Meteor.User;
      connection: Meteor.Connection;
    }) => void
  ): void;
}

export namespace Accounts {
  interface LoginMethodOptions {
    /**
     * The method to call (default 'login')
     */
    methodName?: string | undefined;
    /**
     * The arguments for the method
     */
    methodArguments?: any[] | undefined;
    /**
     * If provided, will be called with the result of the
     * method. If it throws, the client will not be logged in (and
     * its error will be passed to the callback).
     */
    validateResult?: Function | undefined;
    /**
     * Will be called with no arguments once the user is fully
     * logged in, or with the error on error.
     */
    userCallback?: ((err?: any) => void) | undefined;
  }

  /**
   *
   * Call a login method on the server.
   *
   * A login method is a method which on success calls `this.setUserId(id)` and
   * `Accounts._setLoginToken` on the server and returns an object with fields
   * 'id' (containing the user id), 'token' (containing a resume token), and
   * optionally `tokenExpires`.
   *
   * This function takes care of:
   * - Updating the Meteor.loggingIn() reactive data source
   * - Calling the method in 'wait' mode
   * - On success, saving the resume token to localStorage
   * - On success, calling Accounts.connection.setUserId()
   * - Setting up an onReconnect handler which logs in with
   *   the resume token
   *
   * Options:
   * - methodName: The method to call (default 'login')
   * - methodArguments: The arguments for the method
   * - validateResult: If provided, will be called with the result of the
   *   method. If it throws, the client will not be logged in (and
   *   its error will be passed to the callback).
   * - userCallback: Will be called with no arguments once the user is fully
   * logged in, or with the error on error.
   *
   * */
  function callLoginMethod(options: LoginMethodOptions): void;

  type LoginMethodResult = { error: Error } | {
    userId: string;
    error?: Error;
    stampedLoginToken?: StampedLoginToken;
    options?: Record<string, any>;
  };

  /**
   *
   * The main entry point for auth packages to hook in to login.
   *
   * A login handler is a login method which can return `undefined` to
   * indicate that the login request is not handled by this handler.
   *
   * @param name {String} Optional.  The service name, used by default
   * if a specific service name isn't returned in the result.
   *
   * @param handler {Function} A function that receives an options object
   * (as passed as an argument to the `login` method) and returns one of:
   * - `undefined`, meaning don't handle;
   * - a login method result object
   **/
  function registerLoginHandler(
    handler: (options: any) => undefined | LoginMethodResult
  ): void;
  function registerLoginHandler(
    name: string,
    handler: (options: any) => undefined | LoginMethodResult
  ): void;

  type Password =
    | string
    | {
      digest: string;
      algorithm: 'sha-256';
    };

  /**
   *
   * Check whether the provided password matches the bcrypt'ed password in
   * the database user record. `password` can be a string (in which case
   * it will be run through SHA256 before bcrypt) or an object with
   * properties `digest` and `algorithm` (in which case we bcrypt
   * `password.digest`).
   */
  function _checkPasswordAsync(
    user: Meteor.User,
    password: Password
  ): Promise<{ userId: string; error?: any }>
}

export namespace Accounts {
  type StampedLoginToken = {
    token: string;
    when: Date;
  };
  type HashedStampedLoginToken = {
    hashedToken: string;
    when: Date;
  };

  function _generateStampedLoginToken(): StampedLoginToken;
  function _hashStampedToken(token: StampedLoginToken): HashedStampedLoginToken;
  function _insertHashedLoginToken<T>(
    userId: string,
    token: HashedStampedLoginToken,
    query?: Mongo.Selector<T> | Mongo.ObjectID | string
  ): void;
  function _hashLoginToken(token: string): string;
}
