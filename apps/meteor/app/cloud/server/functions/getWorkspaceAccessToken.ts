import type { IWorkspaceCredentials } from '@rocket.chat/core-typings';
import { WorkspaceCredentials } from '@rocket.chat/models';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { workspaceScopes } from '../oauthScopes';
import { getWorkspaceAccessTokenWithScope } from './getWorkspaceAccessTokenWithScope';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

const hasWorkspaceAccessTokenExpired = (credentials: IWorkspaceCredentials): boolean => new Date() >= credentials.expirationDate;

/**
 * Returns the access token for the workspace, if it is expired or forceNew is true, it will get a new one
 * and save it to the database, therefore if this function does not throw an error, it will always return a valid token.
 *
 * @param {boolean} forceNew - If true, it will get a new token even if the current one is not expired
 * @param {string} scope - The scope of the token to get
 * @param {boolean} save - If true, it will save the new token to the database
 * @throws {CloudWorkspaceAccessTokenError} If the workspace is not registered (no credentials in the database)
 *
 * @returns string - A valid access token for the workspace
 */
export async function getWorkspaceAccessToken(forceNew = false, scope = '', save = true, throwOnError = false): Promise<string> {
	const { workspaceRegistered } = await retrieveRegistrationStatus();

	if (!workspaceRegistered) {
		return '';
	}

	// Note: If no scope is given, it means we should assume the default scope, we store the default scopes
	//       in the global variable workspaceScopes.
	if (scope === '') {
		scope = workspaceScopes.join(' ');
	}

	const workspaceCredentials = await WorkspaceCredentials.getCredentialByScope(scope);
	if (workspaceCredentials && !hasWorkspaceAccessTokenExpired(workspaceCredentials) && !forceNew) {
		SystemLogger.debug(
			`Workspace credentials cache hit using scope: ${scope}. Avoiding generating a new access token from cloud services.`,
		);
		return workspaceCredentials.accessToken;
	}

	SystemLogger.debug(`Workspace credentials cache miss using scope: ${scope}, fetching new access token from cloud services.`);

	const accessToken = await getWorkspaceAccessTokenWithScope({ scope, throwOnError });

	if (save) {
		await WorkspaceCredentials.updateCredentialByScope({
			scope: accessToken.scope,
			accessToken: accessToken.token,
			expirationDate: accessToken.expiresAt,
		});
	}

	return accessToken.token;
}

export class CloudWorkspaceAccessTokenError extends Error {
	constructor() {
		super('Could not get workspace access token');
	}
}

export const isAbortError = (error: unknown): error is { type: 'AbortError' } => {
	if (typeof error !== 'object' || error === null) {
		return false;
	}

	return 'type' in error && error.type === 'AbortError';
};

export class CloudWorkspaceAccessTokenEmptyError extends Error {
	constructor() {
		super('Workspace access token is empty');
	}
}

export async function getWorkspaceAccessTokenOrThrow(forceNew = false, scope = '', save = true): Promise<string> {
	const token = await getWorkspaceAccessToken(forceNew, scope, save, true);

	if (!token) {
		throw new CloudWorkspaceAccessTokenEmptyError();
	}

	return token;
}

export const generateWorkspaceBearerHttpHeaderOrThrow = async (
	forceNew = false,
	scope = '',
	save = true,
): Promise<{ Authorization: string }> => {
	const token = await getWorkspaceAccessTokenOrThrow(forceNew, scope, save);
	return {
		Authorization: `Bearer ${token}`,
	};
};

export const generateWorkspaceBearerHttpHeader = async (
	forceNew = false,
	scope = '',
	save = true,
): Promise<{ Authorization: string } | undefined> => {
	const token = await getWorkspaceAccessToken(forceNew, scope, save);

	if (!token) {
		return undefined;
	}

	return {
		Authorization: `Bearer ${token}`,
	};
};
