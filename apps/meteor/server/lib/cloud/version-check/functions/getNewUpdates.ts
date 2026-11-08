import os from 'node:os';

import { Settings } from '@rocket.chat/models';
import { ajv } from '@rocket.chat/rest-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { getWorkspaceAccessToken } from '../..';
import { Info } from '../../../../../rocketchat.info';

type UpdatesResponse = {
	versions: {
		version: string;
		security: boolean;
		infoUrl: string;
	}[];

	alerts: {
		id: string;
		priority: number;
		title: string;
		text: string;
		textArguments?: string[];
		modifiers: string[];
		infoUrl: string;
	}[];
};

const isUpdatesResponse = ajv.compile<UpdatesResponse>({
	type: 'object',
	properties: {
		versions: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					version: { type: 'string' },
					security: { type: 'boolean' },
					infoUrl: { type: 'string' },
				},
				required: ['version', 'infoUrl'],
			},
		},
		alerts: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					title: { type: 'string' },
					text: { type: 'string' },
					textArguments: { type: 'array' },
					modifiers: { type: 'array', items: { type: 'string' } },
					infoUrl: { type: 'string' },
				},
				required: ['id', 'title', 'text', 'textArguments', 'modifiers', 'infoUrl'],
			},
		},
	},
	required: ['versions'],
});

/** @deprecated */

export const getNewUpdates = async () => {
	try {
		const uniqueID = await Settings.findOne('uniqueID');

		if (!uniqueID) {
			throw new Error('uniqueID not found');
		}

		const params = {
			uniqueId: String(uniqueID.value),
			installedAt: uniqueID.createdAt.toJSON(),
			version: Info.version,
			osType: os.type(),
			osPlatform: os.platform(),
			osArch: os.arch(),
			osRelease: os.release(),
			nodeVersion: process.version,
			deployMethod: process.env.DEPLOY_METHOD || 'tar',
			deployPlatform: process.env.DEPLOY_PLATFORM || 'selfinstall',
		};

		const token = await getWorkspaceAccessToken();
		const headers = {
			...(token && { Authorization: `Bearer ${token}` }),
		};
		const url = 'https://releases.rocket.chat/updates/check';
		const response = await fetch(url, {
			headers,
			params,
			// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
			ignoreSsrfValidation: true,
		});

		const data = await response.json();

		if (!isUpdatesResponse(data)) {
			throw new Error('Invalid updates response');
		}

		return data;
	} catch (error) {
		// There's no need to log this error
		// as it's pointless and the user
		// can't do anything about it anyways

		return {
			versions: [],
			alerts: [],
		};
	}
};
