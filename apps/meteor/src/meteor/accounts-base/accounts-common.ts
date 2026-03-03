import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Hook } from 'meteor/callback-hook';
import { Connection, DDP } from 'meteor/ddp-client';

const VALID_CONFIG_KEYS = [
    'forbidClientAccountCreation',
    'loginExpiration',
    'loginExpirationInDays',
    'ambiguousErrorMessages',
    'defaultFieldSelector',
    'collection',
    'clientStorage',
    'ddpUrl',
    'connection',
];

export const DEFAULT_LOGIN_EXPIRATION_DAYS = 90;
export const MIN_TOKEN_LIFETIME_CAP_SECS = 3600; // one hour
export const LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100;

export type AccountsConfigOptions = {
    connection?: Connection;
    ddpUrl?: string;
    collection?: string | Mongo.Collection<Meteor.User>;
    defaultFieldSelector?: Record<string, 0 | 1>;
    loginExpiration?: number;
    loginExpirationInDays?: number | null;
    clientStorage?: 'session' | 'local';
    [key: string]: any;
};

class LoginCancelledError extends Error {
    override name = 'Accounts.LoginCancelledError';
    numericError = 0x8acdc2f;
    constructor(message?: string | undefined) {
        super(message);
    }
}

export class AccountsCommon {
    protected _options: AccountsConfigOptions;
    protected _connection?: Connection;
    protected _users?: Mongo.Collection<Meteor.User>;

    protected _onLoginHook: Hook;
    protected _onLoginFailureHook: Hook;
    protected _onLogoutHook: Hook;

    LoginCancelledError = LoginCancelledError;

    constructor(options: AccountsConfigOptions = {}) {
        for (const key of Object.keys(options)) {
            if (!VALID_CONFIG_KEYS.includes(key)) {
                console.error(`Accounts.config: Invalid key: ${key}`);
            }
        }

        this._options = options;

        this._onLoginHook = new Hook({ debugPrintExceptions: 'onLogin callback' });
        this._onLoginFailureHook = new Hook({ debugPrintExceptions: 'onLoginFailure callback' });
        this._onLogoutHook = new Hook({ debugPrintExceptions: 'onLogout callback' });
    }

    // Lazy initialization of the DDP connection avoids the TDZ crash
    public get connection() {
        if (!this._connection) {
            let conn;
            if (this._options.connection) {
                conn = this._options.connection;
            } else if (this._options.ddpUrl) {
                conn = DDP.connect(this._options.ddpUrl);
            } else {
                conn = Meteor.connection;
            }
            this._connection = conn;

            return conn;
        }

        return this._connection;
    }

    public set connection(val: Connection) {
        this._connection = val;
    }

    // Lazy initialization of the user collection
    public get users(): Mongo.Collection<Meteor.User> {
        if (!this._users) {
            if (this._options.collection instanceof Mongo.Collection) {
                this._users = this._options.collection as Mongo.Collection<Meteor.User>;
            } else {
                const collectionName = typeof this._options.collection === 'string' ? this._options.collection : 'users';
                this._users = new Mongo.Collection<Meteor.User>(collectionName, {
                    connection: this.connection,
                });
            }
        }
        return this._users;
    }

    public set users(val: Mongo.Collection<Meteor.User>) {
        this._users = val;
    }

    public userId(): string | null {
        throw new Error('userId method not implemented');
    }

    protected _addDefaultFieldSelector(options: { fields?: Record<string, 0 | 1> } = {}): any {
        if (!this._options.defaultFieldSelector) return options;

        if (!options.fields) {
            return { ...options, fields: this._options.defaultFieldSelector };
        }

        const keys = Object.keys(options.fields);
        if (!keys.length) return options;

        if (!!options.fields[keys[0]]) return options;

        const keys2 = Object.keys(this._options.defaultFieldSelector);
        return this._options.defaultFieldSelector[keys2[0]]
            ? options
            : {
                ...options,
                fields: {
                    ...options.fields,
                    ...this._options.defaultFieldSelector,
                },
            };
    }

public user(options?: { fields?: Record<string, 0 | 1> }): Meteor.User | null {
        const userId = this.userId();
        if (!userId) return null;

        const userDoc = this.users.findOne(userId, this._addDefaultFieldSelector(options));
        return userDoc ? structuredClone(userDoc) : null;
    }

    public async userAsync(options?: { fields?: Record<string, 0 | 1> }): Promise<Meteor.User | null> {
        const userId = this.userId();
        if (!userId) return null;

        const userDoc = await this.users.findOneAsync(userId, this._addDefaultFieldSelector(options));
        return userDoc ? structuredClone(userDoc) : null;
    }

    public config(options: AccountsConfigOptions): void {
        for (const key of Object.keys(options)) {
            if (!VALID_CONFIG_KEYS.includes(key)) {
                console.error(`Accounts.config: Invalid key: ${key}`);
            }
        }

        for (const key of VALID_CONFIG_KEYS) {
            if (key in options) {
                if (key in this._options && key !== 'collection' && key !== 'clientStorage') {
                    throw new Meteor.Error(`Can't set \`${key}\` more than once`);
                }
                this._options[key] = options[key];
            }
        }

        if (options.collection) {
            if (options.collection instanceof Mongo.Collection) {
                this._users = options.collection as Mongo.Collection<Meteor.User>;
            } else if (typeof options.collection === 'string') {
                const currentName = this._users ? (this._users as any)._name : 'users';
                if (options.collection !== currentName) {
                    this._users = new Mongo.Collection<Meteor.User>(options.collection, {
                        connection: this.connection,
                    });
                }
            }
        }
    }

    public onLogin(func: (info: any) => void) {
        const ret = this._onLoginHook.register(func);
        this._startupCallback(ret.callback);
        return ret;
    }

    public onLoginFailure(func: (info: any) => void) {
        return this._onLoginFailureHook.register(func);
    }

    public onLogout(func: (info: any) => void) {
        return this._onLogoutHook.register(func);
    }

    protected _getTokenLifetimeMs(): number {
        const loginExpirationInDays = this._options.loginExpirationInDays === null
            ? LOGIN_UNEXPIRING_TOKEN_DAYS
            : this._options.loginExpirationInDays;

        return (
            this._options.loginExpiration ||
            (loginExpirationInDays || DEFAULT_LOGIN_EXPIRATION_DAYS) * 86400000
        );
    }

    protected _tokenExpiration(when: string | number | Date): Date {
        return new Date(new Date(when).getTime() + this._getTokenLifetimeMs());
    }

    protected _tokenExpiresSoon(when: string | number | Date): boolean {
        let minLifetimeMs = 0.1 * this._getTokenLifetimeMs();
        const minLifetimeCapMs = MIN_TOKEN_LIFETIME_CAP_SECS * 1000;
        if (minLifetimeMs > minLifetimeCapMs) {
            minLifetimeMs = minLifetimeCapMs;
        }
        return new Date().getTime() > new Date(when).getTime() - minLifetimeMs;
    }

    protected _startupCallback(_callback: Function): void { }
}
