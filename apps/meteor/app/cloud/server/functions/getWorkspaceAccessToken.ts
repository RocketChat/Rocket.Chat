import { Settings, WorkspaceCredentials } from '@rocket.chat/models';

import { getWorkspaceAccessTokenWithScope } from './getWorkspaceAccessTokenWithScope';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

/**
 * @param {boolean} forceNew
 * @param {string} scope
 * @param {boolean} save
 * @returns string
 */
export async function getWorkspaceAccessToken(forceNew = false, scope = '', save = true, throwOnError = false): Promise<string> {
	const { workspaceRegistered } = await retrieveRegistrationStatus();

	if (!workspaceRegistered) {
		return '';
	}

	const expires = await WorkspaceCredentials.getCredentialById('cloud_workspace_access_token_expires_at');
	if (expires === null) {
		throw new Error('Cloud_Workspace_Access_Token_Expires_At is not set');
	}

	const now = new Date();

	if (expires.value && now < expires.value && !forceNew) {
		const accessToken = await WorkspaceCredentials.getCredentialById('cloud_workspace_access_token');
		if (!accessToken) {
			throw new Error('cloud_workspace_access_token is not set');
		}

		return accessToken.value;
	}

	const accessToken = await getWorkspaceAccessTokenWithScope(scope, throwOnError);

	if (save) {
		await Promise.all([
			WorkspaceCredentials.updateCredential('cloud_workspace_access_token', accessToken.token),
			Settings.updateValueById('Cloud_Workspace_Access_Token_Expires_At', accessToken.expiresAt),
		]);
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
