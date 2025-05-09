import { VoipFreeSwitch } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import {
	isVoipFreeSwitchExtensionAssignProps,
	isVoipFreeSwitchExtensionGetDetailsProps,
	isVoipFreeSwitchExtensionGetInfoProps,
	isVoipFreeSwitchExtensionListProps,
} from '@rocket.chat/rest-typings';
import { wrapExceptions } from '@rocket.chat/tools';

import { API } from '../../../../app/api/server';
import { settings } from '../../../../app/settings/server/cached';

API.v1.addRoute(
	'voip-freeswitch.extension.list',
	{
		authRequired: true,
		permissionsRequired: ['manage-voip-extensions'],
		validateParams: isVoipFreeSwitchExtensionListProps,
		license: ['voip-enterprise'],
	},
	{
		async get() {
			if (!settings.get('VoIP_TeamCollab_Enabled')) {
				throw new Error('error-voip-disabled');
			}

			const { username, type = 'all' } = this.queryParams;

			const extensions = await wrapExceptions(() => VoipFreeSwitch.getExtensionList()).catch(() => {
				throw new Error('error-loading-extension-list');
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
	{
		authRequired: true,
		permissionsRequired: ['manage-voip-extensions'],
		validateParams: isVoipFreeSwitchExtensionAssignProps,
		license: ['voip-enterprise'],
	},
	{
		async post() {
			if (!settings.get('VoIP_TeamCollab_Enabled')) {
				throw new Error('error-voip-disabled');
			}

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
				throw new Error('error-extension-not-available');
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
	{
		authRequired: true,
		permissionsRequired: ['view-voip-extension-details'],
		validateParams: isVoipFreeSwitchExtensionGetDetailsProps,
		license: ['voip-enterprise'],
	},
	{
		async get() {
			if (!settings.get('VoIP_TeamCollab_Enabled')) {
				throw new Error('error-voip-disabled');
			}

			const { extension, group } = this.queryParams;

			if (!extension) {
				throw new Error('error-invalid-params');
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
	{
		authRequired: true,
		permissionsRequired: ['view-user-voip-extension'],
		validateParams: isVoipFreeSwitchExtensionGetInfoProps,
		license: ['voip-enterprise'],
	},
	{
		async get() {
			if (!settings.get('VoIP_TeamCollab_Enabled')) {
				throw new Error('error-voip-disabled');
			}

			const { userId } = this.queryParams;

			if (!userId) {
				throw new Error('error-invalid-params');
			}

			const user = await Users.findOneById(userId, { projection: { freeSwitchExtension: 1 } });
			if (!user) {
				throw new Error('error-user-not-found');
			}

			const { freeSwitchExtension: extension } = user;

			if (!extension) {
				throw new Error('error-extension-not-assigned');
			}

			const extensionData = await wrapExceptions(() => VoipFreeSwitch.getExtensionDetails({ extension })).suppress(() => undefined);
			if (!extensionData) {
				return API.v1.notFound('error-registration-not-found');
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
