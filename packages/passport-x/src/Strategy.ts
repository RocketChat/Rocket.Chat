import { format, parse as urlParse } from 'url';

import type { Request } from 'express';
import OAuthStrategy, { InternalOAuthError, type OAuthClient } from 'passport-oauth1';

import { APIError } from './APIError';
import { parse as parseProfile } from './profile';
import type { Profile } from './profile';

// ---------------------------------------------------------------------------
// Strategy options
// ---------------------------------------------------------------------------

export interface IStrategyOptions {
	consumerKey: string;
	consumerSecret: string;
	callbackURL: string;
	requestTokenURL?: string;
	accessTokenURL?: string;
	userAuthorizationURL?: string;
	sessionKey?: string;
	userProfileURL?: string;
	skipExtendedUserProfile?: boolean;
	includeEmail?: boolean;
	includeStatus?: boolean;
	includeEntities?: boolean;
	forceLogin?: boolean;
	screenName?: string;
}

// ---------------------------------------------------------------------------
// Strategy
// ---------------------------------------------------------------------------

type DoneCallback = (err: Error | null, profile?: Profile | { provider: string; id: string; username: string }) => void;

/**
 * `Strategy` constructor.
 *
 * The Twitter/X authentication strategy authenticates requests by delegating to
 * Twitter using the OAuth protocol.
 *
 * Applications must supply a `verify` callback which accepts a `token`,
 * `tokenSecret` and service-specific `profile`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid. If an exception occurred, `err` should be set.
 *
 * Options:
 *   - `consumerKey`     identifies client to Twitter
 *   - `consumerSecret`  secret used to establish ownership of the consumer key
 *   - `callbackURL`     URL to which Twitter will redirect the user after obtaining authorization
 *
 * Examples:
 *
 *     passport.use(new Strategy({
 *         consumerKey: '123-456-789',
 *         consumerSecret: 'shhh-its-a-secret',
 *         callbackURL: 'https://www.example.net/auth/twitter/callback'
 *       },
 *       function(token, tokenSecret, profile, cb) {
 *         User.findOrCreate(..., function (err, user) {
 *           cb(err, user);
 *         });
 *       }
 *     ));
 */
export class Strategy {
	public name: string;

	private _userProfileURL: string;

	private _skipExtendedUserProfile: boolean;

	private _includeEmail: boolean;

	private _includeStatus: boolean;

	private _includeEntities: boolean;

	// Provided by OAuthStrategy base
	declare _oauth: OAuthClient;

	declare fail: (challenge?: unknown, status?: number) => void;

	declare error: (err: Error) => void;

	declare success: (user: unknown, info?: unknown) => void;

	declare redirect: (url: string, status?: number) => void;

	constructor(options: IStrategyOptions, verify: (...args: unknown[]) => void) {
		const opts: Record<string, unknown> = {
			...options,
			requestTokenURL: options.requestTokenURL || 'https://api.twitter.com/oauth/request_token',
			accessTokenURL: options.accessTokenURL || 'https://api.twitter.com/oauth/access_token',
			userAuthorizationURL: options.userAuthorizationURL || 'https://api.twitter.com/oauth/authenticate',
			sessionKey: options.sessionKey || 'oauth:twitter',
		};

		OAuthStrategy.call(this as unknown as OAuthStrategy, opts, verify);
		this.name = 'twitter';
		this._userProfileURL = options.userProfileURL || 'https://api.twitter.com/1.1/account/verify_credentials.json';
		this._skipExtendedUserProfile = options.skipExtendedUserProfile !== undefined ? options.skipExtendedUserProfile : false;
		this._includeEmail = options.includeEmail !== undefined ? options.includeEmail : false;
		this._includeStatus = options.includeStatus !== undefined ? options.includeStatus : true;
		this._includeEntities = options.includeEntities !== undefined ? options.includeEntities : true;
	}

	/**
	 * Authenticate request by delegating to Twitter using OAuth.
	 */
	authenticate(req: Request, options?: Record<string, unknown>): void {
		if (req.query && (req.query as Record<string, unknown>).denied) {
			this.fail();
			return;
		}

		OAuthStrategy.prototype.authenticate.call(this as unknown as OAuthStrategy, req, options);
	}

	/**
	 * Retrieve user profile from Twitter.
	 */
	userProfile(token: string, tokenSecret: string, params: Record<string, string>, done: DoneCallback): void {
		if (!this._skipExtendedUserProfile) {
			const url = urlParse(this._userProfileURL, true);

			if (url.pathname?.endsWith('/users/show.json')) {
				url.query.user_id = params.user_id;
			}
			if (this._includeEmail) {
				url.query.include_email = 'true';
			}
			if (!this._includeStatus) {
				url.query.skip_status = 'true';
			}
			if (!this._includeEntities) {
				url.query.include_entities = 'false';
			}
			url.search = null;

			this._oauth.get(format(url), token, tokenSecret, (err, body, res) => {
				if (err) {
					let json: { errors?: { message: string; code: number }[] } | undefined;
					const oauthErr = err;
					if (oauthErr.data) {
						try {
							json = JSON.parse(oauthErr.data);
						} catch {
							// ignore parse error
						}
					}

					if (json?.errors?.length) {
						const e = json.errors[0];
						return done(new APIError(e.message, e.code));
					}
					return done(new InternalOAuthError('Failed to fetch user profile', err));
				}

				let json: Record<string, unknown>;
				try {
					json = JSON.parse(body!);
				} catch {
					return done(new Error('Failed to parse user profile'));
				}

				const profile: Profile = {
					...parseProfile(json),
					provider: 'twitter',
					_raw: body!,
					_json: json,
					_accessLevel: res?.headers['x-access-level'],
				};

				return done(null, profile);
			});
		} else {
			done(null, {
				provider: 'twitter',
				id: params.user_id,
				username: params.screen_name,
			});
		}
	}

	/**
	 * Return extra Twitter-specific parameters to be included in the user
	 * authorization request.
	 */
	userAuthorizationParams(options: Record<string, unknown>): Record<string, unknown> {
		const params: Record<string, unknown> = {};
		if (options.forceLogin) {
			params.force_login = options.forceLogin;
		}
		if (options.screenName) {
			params.screen_name = options.screenName;
		}
		return params;
	}

	/**
	 * Parse error response from Twitter OAuth endpoint.
	 */
	parseErrorResponse(body: string, _status: number): Error | undefined {
		try {
			const json: unknown = JSON.parse(body);
			if (typeof json === 'object' && json !== null && 'errors' in json && Array.isArray(json.errors) && json.errors.length > 0) {
				const first: unknown = json.errors[0];
				if (typeof first === 'object' && first !== null && 'message' in first && typeof first.message === 'string') {
					return new Error(first.message);
				}
			}
		} catch {
			// Not JSON — try XML
			const match = /<error>(.*?)<\/error>/.exec(body);
			if (match) {
				return new Error(match[1]);
			}
			return new Error(body);
		}

		return undefined;
	}
}

// Wire up prototype chain: Strategy extends OAuthStrategy
Object.setPrototypeOf(Strategy.prototype, OAuthStrategy.prototype);
