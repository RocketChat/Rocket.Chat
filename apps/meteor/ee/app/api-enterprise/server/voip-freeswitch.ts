import { VoipFreeSwitch } from '@rocket.chat/core-services';
import type { FreeSwitchExtension } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import {
	isVoipFreeSwitchExtensionAssignProps,
	isVoipFreeSwitchExtensionGetDetailsProps,
	isVoipFreeSwitchExtensionGetInfoProps,
	isVoipFreeSwitchExtensionListProps,
	type VoipFreeSwitchExtensionAssignProps,
	type VoipFreeSwitchExtensionGetDetailsProps,
	type VoipFreeSwitchExtensionGetInfoProps,
	type VoipFreeSwitchExtensionListProps,
} from '@rocket.chat/rest-typings';
import { wrapExceptions } from '@rocket.chat/tools';

import { API } from '../../../../app/api/server';
import { settings } from '../../../../app/settings/server/cached';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/voip-freeswitch.extension.list': {
			GET: (params: VoipFreeSwitchExtensionListProps) => { extensions: FreeSwitchExtension[] };
		};
		'/v1/voip-freeswitch.extension.getDetails': {
			GET: (params: VoipFreeSwitchExtensionGetDetailsProps) => FreeSwitchExtension & { userId?: string; username?: string; name?: string };
		};
		'/v1/voip-freeswitch.extension.assign': {
			POST: (params: VoipFreeSwitchExtensionAssignProps) => void;
		};
		'/v1/voip-freeswitch.extension.getRegistrationInfoByUserId': {
			GET: (params: VoipFreeSwitchExtensionGetInfoProps) => {
				extension: FreeSwitchExtension;
				credentials: { password: string; websocketPath: string };
			};
		};
	}
}

API.v1.addRoute(
	'voip-freeswitch.extension.list',
	{ authRequired: true, permissionsRequired: ['manage-voip-call-settings'], validateParams: isVoipFreeSwitchExtensionListProps },
	{
		async get() {
			const { username, type = 'all' } = this.queryParams;

			const extensions = await wrapExceptions(() => VoipFreeSwitch.getExtensionList()).catch(() => {
				throw new Error('Failed to load extension list.');
			});

			if (type === 'all') {
				return API.v1.success({ extensions });
			}

			const assignedExtensions = await Users.findAssignedFreeSwitchExtensions().toArray();

			switch (type) {
				case 'free':
					const freeExtensions = extensions.filter(({ extension }) => !assignedExtensions.includes(extension));
					return API.v1.success({ extensions: freeExtensions });
				case 'allocated':
					// Extensions that are already assigned to some user
					const allocatedExtensions = extensions.filter(({ extension }) => assignedExtensions.includes(extension));
					return API.v1.success({ extensions: allocatedExtensions });
				case 'available':
					// Extensions that are free or assigned to the specified user
					const user = (username && (await Users.findOneByUsername(username, { projection: { freeSwitchExtension: 1 } }))) || undefined;
					const currentExtension = user?.freeSwitchExtension;

					const availableExtensions = extensions.filter(
						({ extension }) => extension === currentExtension || !assignedExtensions.includes(extension),
					);

					return API.v1.success({ extensions: availableExtensions });
			}

			return API.v1.success({ extensions });
		},
	},
);

API.v1.addRoute(
	'voip-freeswitch.extension.assign',
	{ authRequired: true, permissionsRequired: ['manage-voip-call-settings'], validateParams: isVoipFreeSwitchExtensionAssignProps },
	{
		async post() {
			const { extension, username } = this.bodyParams;

			if (!username) {
				return API.v1.notFound();
			}

			const user = await Users.findOneByUsername(username, { projection: { freeSwitchExtension: 1 } });
			if (!user) {
				return API.v1.notFound();
			}

			const existingUser = extension && (await Users.findOneByFreeSwitchExtension(extension, { projection: { _id: 1 } }));
			if (existingUser && existingUser._id !== user._id) {
				throw new Error('Extension not available.');
			}

			if (extension && user.freeSwitchExtension === extension) {
				return API.v1.success();
			}

			await Users.setFreeSwitchExtension(user._id, extension);
			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'voip-freeswitch.extension.getDetails',
	{ authRequired: true, validateParams: isVoipFreeSwitchExtensionGetDetailsProps },
	{
		async get() {
			const { extension, group } = this.queryParams;

			if (!extension) {
				throw new Error('Invalid params');
			}

			const extensionData = await wrapExceptions(() => VoipFreeSwitch.getExtensionDetails({ extension, group })).suppress(() => undefined);
			if (!extensionData) {
				return API.v1.notFound();
			}

			const existingUser = await Users.findOneByFreeSwitchExtension(extensionData.extension, { projection: { username: 1, name: 1 } });

			return API.v1.success({
				...extensionData,
				...(existingUser && { userId: existingUser._id, name: existingUser.name, username: existingUser.username }),
			});
		},
	},
);

API.v1.addRoute(
	'voip-freeswitch.extension.getRegistrationInfoByUserId',
	{ authRequired: true, validateParams: isVoipFreeSwitchExtensionGetInfoProps },
	{
		async get() {
			const { userId } = this.queryParams;

			if (!userId) {
				throw new Error('Invalid params.');
			}

			const user = await Users.findOneById(userId, { projection: { freeSwitchExtension: 1 } });
			if (!user) {
				throw new Error('User not found.');
			}

			const { freeSwitchExtension: extension } = user;

			if (!extension) {
				throw new Error('Extension not assigned.');
			}

			const extensionData = await wrapExceptions(() => VoipFreeSwitch.getExtensionDetails({ extension })).suppress(() => undefined);
			if (!extensionData) {
				return API.v1.notFound();
			}
			const password = await wrapExceptions(() => VoipFreeSwitch.getUserPassword(extension)).suppress(() => undefined);

			return API.v1.success({
				extension: extensionData,
				credentials: {
					websocketPath: settings.get<string>('VoIP_TeamCollab_FreeSwitch_WebSocket_Path'),
					password,
				},
			});
		},
	},
);
