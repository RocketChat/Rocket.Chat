import { MeteorError } from './errors';
import { EnvironmentVariable, bindEnvironment } from './dynamics';
import { defer, setTimeout, setInterval, clearTimeout, clearInterval } from './timers';
import { _debug } from './debug';
import { AsynchronousQueue, SynchronousQueue } from './queues';
import { startup } from './startup';
import { Connection } from 'meteor/ddp-client';
import { Accounts } from 'meteor/accounts-base';
import { withLocalStorage } from 'meteor/localstorage';
import { _ensure, _get } from './helpers';
import { absoluteUrl } from './url';

export const refresh = () => { };
let _connection: Connection | null = null;
export const isClient = true;
export const isServer = false;
export const isCordova = false;

export const Error = MeteorError;

export type User = {
  _id: string;
}

export declare namespace Meteor {
  type User = {
    _id: string;
  };

  type Error = MeteorError;

  type TypedError = MeteorError & { errorType: string };

  interface LoginWithExternalServiceOptions {
    requestPermissions?: ReadonlyArray<string> | undefined;
    requestOfflineToken?: Boolean | undefined;
    forceApprovalPrompt?: Boolean | undefined;
    redirectUrl?: string | undefined;
    loginHint?: string | undefined;
    loginStyle?: string | undefined;
  }
}

const settings: Record<string, any> = {};

export const Meteor = withLocalStorage({
  // Hardcoded environment flags for standard client builds
  settings,
  absoluteUrl,

  get user() {
    return Accounts.user.bind(Accounts);
  },
  set user(value) {
    Accounts.user = value.bind(Accounts);
  },
  get userAsync() {
    return Accounts.userAsync.bind(Accounts);
  },
  set userAsync(value) {
    Accounts.userAsync = value.bind(Accounts);
  },
  get userId() {
    return Accounts.userId.bind(Accounts);
  },
  set userId(value) {
    Accounts.userId = value.bind(Accounts);
  },
  get users() {
    return Accounts.users;
  },
  set users(value) {
    Accounts.users = value;
  },
  get loggingIn() {
    return Accounts.loggingIn.bind(Accounts);
  },
  set loggingIn(value) {
    Accounts.loggingIn = value.bind(Accounts);
  },
  get loggingOut() {
    return Accounts.loggingOut.bind(Accounts);
  },
  set loggingOut(value) {
    Accounts.loggingOut = value.bind(Accounts);
  },
  get logout() {
    return Accounts.logout.bind(Accounts);
  },
  set logout(value: typeof Accounts.logout) {
    Accounts.logout = value.bind(Accounts);
  },
  get logoutAllClients() {
    return Accounts.logoutAllClients.bind(Accounts);
  },
  set logoutAllClients(value) {
    Accounts.logoutAllClients = value.bind(Accounts);
  },
  get logoutOtherClients() {
    return Accounts.logoutOtherClients.bind(Accounts);
  },
  set logoutOtherClients(value) {
    Accounts.logoutOtherClients = value.bind(Accounts);
  },

  // --- Auth Proxies ---
  get loginWithPassword() {
    return Accounts.loginWithPassword.bind(Accounts);
  },
  set loginWithPassword(value) {
    Accounts.loginWithPassword = value.bind(Accounts);
  },

  get loginWithToken() {
    return Accounts.loginWithToken.bind(Accounts);
  },
  set loginWithToken(value) {
    Accounts.loginWithToken = value.bind(Accounts);
  },
  // --------------------

  EnvironmentVariable,
  bindEnvironment,

  get connection() {
    if (!_connection) {
      _connection = new Connection('/', { retry: true });
    }
    return _connection;
  },
  set connection(conn: Connection) {
    _connection = conn;
  },

  // --- DDP Connection Proxies ---
  get call(): Connection['call'] {
    return this.connection.call.bind(this.connection);
  },
  set call(value: Connection['call']) {
    this.connection.call = value.bind(this.connection);
  },

  get callAsync(): Connection['callAsync'] {
    return this.connection.callAsync.bind(this.connection);
  },
  set callAsync(value: Connection['callAsync']) {
    this.connection.callAsync = value;
  },

  get apply(): Connection['apply'] {
    return this.connection.apply.bind(this.connection);
  },
  set apply(value: Connection['apply']) {
    this.connection.apply = value.bind(this.connection);
  },

  get applyAsync() {
    return this.connection.applyAsync.bind(this.connection);
  },
  set applyAsync(value) {
    this.connection.applyAsync = value.bind(this.connection);
  },

  get methods() {
    return this.connection.methods.bind(this.connection);
  },
  set methods(value) {
    this.connection.methods = value.bind(this.connection);
  },

  get subscribe() {
    return this.connection.subscribe.bind(this.connection);
  },
  set subscribe(value) {
    this.connection.subscribe = value.bind(this.connection);
  },

  get status() {
    return this.connection.status.bind(this.connection);
  },

  set status(value) {
    this.connection.status = value.bind(this.connection);
  },

  get reconnect() {
    return this.connection.reconnect.bind(this.connection);
  },

  set reconnect(value) {
    this.connection.reconnect = value.bind(this.connection);
  },

  get disconnect() {
    return this.connection.disconnect.bind(this.connection);
  },
  set disconnect(value) {
    this.connection.disconnect = value.bind(this.connection);
  },
  // ------------------------------

  Error,
  defer,
  setTimeout,
  setInterval,
  clearTimeout,
  clearInterval,

  _AsynchronousQueue: AsynchronousQueue,
  _SynchronousQueue: SynchronousQueue,

  _debug,
  startup,
  refresh,

  // Minimal utility polyfills that some legacy packages still look for
  _get,
  _ensure,

  // Stubs for safely removing nodejs/server specific features
  _noYieldsAllowed: (f: Function) => f(),
});
