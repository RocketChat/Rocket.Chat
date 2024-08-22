import type { ISetting, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Settings } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { WithId } from 'mongodb';

import { getSettingPermissionId } from '../../../app/authorization/lib';
import { hasPermissionAsync, hasAtLeastOnePermissionAsync } from '../../../app/authorization/server/functions/hasPermission';
import { SettingsEvents } from '../../../app/settings/server';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'public-settings/get'(
			updatedSince?: Date,
		): Promise<ISetting[] | { update: ISetting[]; remove: WithId<RocketChatRecordDeleted<ISetting>>[] }>;
		'private-settings/get'(
			updatedSince?: Date,
		): Promise<ISetting[] | { update: ISetting[]; remove: WithId<RocketChatRecordDeleted<ISetting>>[] }>;
	}
}

Meteor.methods<ServerMethods>({
	async 'public-settings/get'(updatedAt) {
		if (updatedAt instanceof Date) {
			const records = await Settings.findNotHiddenPublicUpdatedAfter(updatedAt).toArray();
			SettingsEvents.emit('fetch-settings', records);

			return {
				update: records,
				remove: await Settings.trashFindDeletedAfter(
					updatedAt,
					{
						hidden: {
							$ne: true,
						},
						public: true,
					},
					{
						projection: {
							_id: 1,
							_deletedAt: 1,
						},
					},
				).toArray(),
			};
		}

		const publicSettings = (await Settings.findNotHiddenPublic().toArray()) as ISetting[];
		SettingsEvents.emit('fetch-settings', publicSettings);

		return publicSettings;
	},
	async 'private-settings/get'(updatedAfter) {
		const uid = Meteor.userId();

		if (!uid) {
			return [];
		}

		const privilegedSetting = await hasAtLeastOnePermissionAsync(uid, ['view-privileged-setting', 'edit-privileged-setting']);
		const manageSelectedSettings = privilegedSetting || (await hasPermissionAsync(uid, 'manage-selected-settings'));

		if (!manageSelectedSettings) {
			return [];
		}

		const bypass = async <T>(settings: T): Promise<T> => settings;

		const applyFilter = <T extends any[], U>(fn: (args: T) => Promise<U>, args: T): Promise<U> => fn(args);

		const getAuthorizedSettingsFiltered = async (settings: ISetting[]): Promise<ISetting[]> =>
			(
				await Promise.all(
					settings.map(async (record) => {
						if (await hasPermissionAsync(uid, getSettingPermissionId(record._id))) {
							return record;
						}
					}),
				)
			).filter(Boolean) as ISetting[];

		const getAuthorizedSettings = async (updatedAfter: Date | undefined, privilegedSetting: boolean): Promise<ISetting[]> =>
			applyFilter(
				privilegedSetting ? bypass : getAuthorizedSettingsFiltered,
				await Settings.findNotHidden(updatedAfter && { updatedAfter }).toArray(),
			);

		if (!(updatedAfter instanceof Date)) {
			// this does not only imply an unfiltered setting range, it also identifies the caller's context:
			// If called *with* filter (see below), the user wants a collection as a result.
			// in this case, it shall only be a plain array
			return getAuthorizedSettings(updatedAfter, privilegedSetting);
		}

		return {
			update: await getAuthorizedSettings(updatedAfter, privilegedSetting),
			remove: await Settings.trashFindDeletedAfter(
				updatedAfter,
				{
					hidden: {
						$ne: true,
					},
				},
				{
					projection: {
						_id: 1,
						_deletedAt: 1,
					},
				},
			).toArray(),
		};
	},
});
