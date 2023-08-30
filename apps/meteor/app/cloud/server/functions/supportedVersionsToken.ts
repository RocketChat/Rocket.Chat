import { Settings } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import { generateWorkspaceBearerHttpHeader } from './getWorkspaceAccessToken';

export const getSupportedVersionsToken = async (): Promise<string> => {
	const headers = await generateWorkspaceBearerHttpHeader();

	const response = await fetch('https://releases.rocket.chat/supported/server', {
		headers,
	});
	const data = await response.json();
	const { signed } = data;

	return signed;
};

export const cacheNewSupportedVersionsToken = async (): Promise<void> => {
	try {
		const signed = await getSupportedVersionsToken();

		await Settings.updateValueById('Cloud_Workspace_Supported_Versions_Token', signed);
	} catch (error) {
		SystemLogger.error({
			msg: 'Failed to fetch supported versions token',
			url: 'https://releases.rocket.chat/supported/server',
		});
	}
};

export const getCachedSupportedVersionsToken = async (): Promise<string> => {
	const token = settings.get<string>('Cloud_Workspace_Supported_Versions_Token');

	if (token) {
		return token;
	}

	return getSupportedVersionsToken();
};
