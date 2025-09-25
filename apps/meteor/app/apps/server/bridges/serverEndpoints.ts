import { Buffer } from 'buffer';

import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { ServerEndpointsBridge } from '@rocket.chat/apps-engine/server/bridges/ServerEndpointsBridge';
import type { IServerEndpointCallInfo, IServerEndpointResponse } from '@rocket.chat/apps-engine/server/bridges/ServerEndpointsBridge';
import { User } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import qs from 'qs';

import { API } from '../../../api/server/api';

type CacheEntry = { userId: string; token: string; hashedToken: string; expiresAt: number; timer?: NodeJS.Timeout };

const IMPERSONATION_TOKEN_TTL_MS = 3 * 60 * 1000; // 3 minutes
const APP_USER_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

export class AppServerEndpointsBridge extends ServerEndpointsBridge {
	private readonly tokenCache = new Map<string, CacheEntry>();

	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async call<T = unknown>(info: IServerEndpointCallInfo): Promise<IServerEndpointResponse<T>> {
		this.orch.debugLog(`App ${info.appId} is calling server endpoint ${info.method} ${info.path}`);
		const subpath = String(info.path || '').replace(/^\/+/, '');
		const url = `${subpath}${info.query ? `?${qs.stringify(info.query)}` : ''}`;

		const headers: Record<string, string> = Object.fromEntries(
			Object.entries(info.headers || {}).map(([k, v]) => [k.toLowerCase(), String(v)]),
		);

		let usedAppToken = false;
		let usedImpersonationKey: string | undefined;

		if (info.user?.id && info.user?.token) {
			headers['x-user-id'] = info.user.id;
			headers['x-auth-token'] = info.user.token;
		} else if (info.user?.id) {
			const { userId, token, cacheKey } = await this.ensureImpersonationToken(info.appId, info.user.id);
			headers['x-user-id'] = userId;
			headers['x-auth-token'] = token;
			usedImpersonationKey = cacheKey;
		} else {
			const { userId, token } = await this.ensureAppUserToken(info.appId);
			headers['x-user-id'] = userId;
			headers['x-auth-token'] = token;
			usedAppToken = true;
		}

		const init: RequestInit = {
			method: info.method,
			headers: new Headers(headers as Record<string, string>),
		};

		if (info.body !== undefined && info.body !== null && ['POST', 'PUT', 'PATCH'].includes(info.method)) {
			if (typeof info.body === 'string' || (typeof info.body === 'object' && Buffer.isBuffer(info.body as any))) {
				(init.headers as Headers).set('content-type', (headers['content-type'] as string) || 'text/plain');
				init.body = info.body as BodyInit;
			} else {
				(init.headers as Headers).set('content-type', 'application/json');
				init.body = JSON.stringify(info.body);
			}
		}
		let res = await API.v1.router.dispatch(url, init);

		// If the app user token became invalid, try refreshing it once transparently
		if (res.status === 401) {
			if (usedImpersonationKey && info.user?.id) {
				await this.invalidateImpersonationToken(usedImpersonationKey);
				const { userId, token, cacheKey } = await this.ensureImpersonationToken(info.appId, info.user.id);
				usedImpersonationKey = cacheKey;
				(init.headers as Headers).set('x-user-id', userId);
				(init.headers as Headers).set('x-auth-token', token);
				res = await API.v1.router.dispatch(url, init);
			} else if (usedAppToken) {
				await this.invalidateAppToken(info.appId);
				const { userId, token } = await this.ensureAppUserToken(info.appId);
				(init.headers as Headers).set('x-user-id', userId);
				(init.headers as Headers).set('x-auth-token', token);
				res = await API.v1.router.dispatch(url, init);
			}
		}

		const outHeaders: Record<string, string> = {};
		res.headers.forEach((v: string, k: string) => {
			outHeaders[k] = v;
		});

		const contentType = res.headers.get('content-type') || '';
		const isJson = contentType.includes('application/json') || contentType.includes('text/javascript');

		let content: string | undefined;
		let data: T | null = null;
		if (res.body) {
			const buf = Buffer.from(await res.arrayBuffer());
			if (isJson) {
				content = buf.toString('utf8');
				try {
					data = JSON.parse(content) as T;
				} catch {
					data = null;
				}
			} else {
				content = buf.toString('utf8');
			}
		}

		return {
			statusCode: res.status,
			headers: outHeaders,
			content,
			data,
		} as IServerEndpointResponse<T>;
	}

	private async ensureAppUserToken(appId: string): Promise<{ userId: string; token: string }> {
		const cacheKey = `app:${appId}`;
		const cached = this.tokenCache.get(cacheKey);
		if (cached) {
			if (Date.now() < cached.expiresAt) {
				return { userId: cached.userId, token: cached.token };
			}
			await this.removeTokenFromDb(cached.userId, cached.hashedToken);
			this.clearTimer(cacheKey);
			this.tokenCache.delete(cacheKey);
		}

		const appUser = await Users.findOneByAppId(appId, {});
		if (!appUser?._id) {
			throw new Error(`App user not found for appId ${appId}`);
		}

		// Durable cleanup: prune expired server-endpoint tokens for this user on cache miss
		await this.pruneExpiredServerEndpointTokens(appUser._id);

		// Tag token with a type so we can identify it later for cleanup (type-safe)
		const baseStamped = (await Accounts._generateStampedLoginToken()) as { token: string; when: Date };
		const stamped = { ...baseStamped, type: 'serverEndpointApp' as const };
		await Accounts._insertLoginToken(appUser._id, stamped as typeof baseStamped & { type: 'serverEndpointApp' });
		await User.ensureLoginTokensLimit(appUser._id);

		const value: CacheEntry = {
			userId: appUser._id,
			token: stamped.token,
			hashedToken: Accounts._hashLoginToken(stamped.token),
			expiresAt: Date.now() + APP_USER_TOKEN_TTL_MS,
		};
		this.scheduleExpiry(cacheKey, value);
		this.tokenCache.set(cacheKey, value);
		return { userId: value.userId, token: value.token };
	}

	private async invalidateAppToken(appId: string): Promise<void> {
		const cacheKey = `app:${appId}`;
		const cached = this.tokenCache.get(cacheKey);
		if (cached) {
			await this.removeTokenFromDb(cached.userId, cached.hashedToken);
		}
		this.clearTimer(cacheKey);
		this.tokenCache.delete(cacheKey);
	}

	private async ensureImpersonationToken(appId: string, userId: string): Promise<{ userId: string; token: string; cacheKey: string }> {
		const cacheKey = `${appId}:${userId}`;
		const cached = this.tokenCache.get(cacheKey);
		if (cached) {
			if (Date.now() < cached.expiresAt) {
				return { userId: cached.userId, token: cached.token, cacheKey };
			}
			await this.removeTokenFromDb(cached.userId, cached.hashedToken);
			this.clearTimer(cacheKey);
			this.tokenCache.delete(cacheKey);
		}

		// Durable cleanup: prune expired server-endpoint tokens for this user on cache miss
		await this.pruneExpiredServerEndpointTokens(userId);

		// Tag token with a type so we can identify it later for cleanup (type-safe)
		const baseStamped = (await Accounts._generateStampedLoginToken()) as { token: string; when: Date };
		const stamped = { ...baseStamped, type: 'serverEndpointImpersonation' as const };
		await Accounts._insertLoginToken(userId, stamped as typeof baseStamped & { type: 'serverEndpointImpersonation' });
		await User.ensureLoginTokensLimit(userId);

		const entry: CacheEntry = {
			userId,
			token: stamped.token,
			hashedToken: Accounts._hashLoginToken(stamped.token),
			expiresAt: Date.now() + IMPERSONATION_TOKEN_TTL_MS,
		};
		this.scheduleExpiry(cacheKey, entry);
		this.tokenCache.set(cacheKey, entry);
		return { userId, token: entry.token, cacheKey };
	}

	private async invalidateImpersonationToken(cacheKey: string): Promise<void> {
		const cached = this.tokenCache.get(cacheKey);
		if (cached) {
			await this.removeTokenFromDb(cached.userId, cached.hashedToken);
		}
		this.clearTimer(cacheKey);
		this.tokenCache.delete(cacheKey);
	}

	private scheduleExpiry(cacheKey: string, entry: CacheEntry) {
		this.clearTimer(cacheKey);
		entry.timer = setTimeout(
			() => {
				// On expiry, remove from DB and cache
				void this.removeTokenFromDb(entry.userId, entry.hashedToken).finally(() => {
					this.tokenCache.delete(cacheKey);
				});
			},
			Math.max(0, entry.expiresAt - Date.now()),
		);
	}

	private clearTimer(cacheKey: string) {
		const c = this.tokenCache.get(cacheKey);
		if (c?.timer) {
			clearTimeout(c.timer);
			delete c.timer;
		}
	}

	private async removeTokenFromDb(userId: string, hashedToken: string) {
		try {
			await Users.updateOne(
				{ _id: userId },
				{
					$pull: { 'services.resume.loginTokens': { hashedToken } },
				},
			);
		} catch {
			this.orch.debugLog(`Failed to remove stale login token for user ${userId}`);
		}
	}

	private async pruneExpiredServerEndpointTokens(userId: string) {
		try {
			const now = Date.now();
			const appThreshold = new Date(now - APP_USER_TOKEN_TTL_MS);
			const impThreshold = new Date(now - IMPERSONATION_TOKEN_TTL_MS);
			await Users.updateOne(
				{ _id: userId },
				{
					$pull: {
						'services.resume.loginTokens': {
							$or: [
								{ type: 'serverEndpointApp', when: { $lt: appThreshold } },
								{ type: 'serverEndpointImpersonation', when: { $lt: impThreshold } },
							],
						},
					},
				},
			);
		} catch {
			this.orch.debugLog(`Failed to prune expired server endpoint tokens for user ${userId}`);
		}
	}
}
