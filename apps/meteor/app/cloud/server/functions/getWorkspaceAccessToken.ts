import { Settings } from '@rocket.chat/models';

import { notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';
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

	const expires = await Settings.findOneById('Cloud_Workspace_Access_Token_Expires_At');

	if (expires === null) {
		throw new Error('Cloud_Workspace_Access_Token_Expires_At is not set');
	}

	const now = new Date();

	if (expires.value && now < expires.value && !forceNew) {
		return settings.get<string>('Cloud_Workspace_Access_Token');
	}

	const accessToken = await getWorkspaceAccessTokenWithScope(scope, throwOnError);

	if (save) {
		(await Settings.updateValueById('Cloud_Workspace_Access_Token', accessToken.token)).modifiedCount &&
			void notifyOnSettingChangedById('Cloud_Workspace_Access_Token');

		(await Settings.updateValueById('Cloud_Workspace_Access_Token_Expires_At', accessToken.expiresAt)).modifiedCount &&
			void notifyOnSettingChangedById('Cloud_Workspace_Access_Token_Expires_At');
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
