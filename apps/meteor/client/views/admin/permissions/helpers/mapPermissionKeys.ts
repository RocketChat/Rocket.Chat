import type { IPermission } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { TFunction } from 'i18next';

export const mapPermissionKeys = ({ t, permissions }: { t: TFunction; permissions: IPermission[] }) =>
	permissions.map(({ _id, settingId, group, section }) => ({
		_id,
		i18nLabels: [group && t(group), section && t(section), settingId && t(settingId), t(_id)].filter(Boolean).join(' '),
	}));

export const filterPermissionKeys = (permissionKeys: { _id: string; i18nLabels: string }[], filter: string): string[] => {
	const words = filter
		.split(' ')
		.filter(Boolean)
		.map((word) => `(?=.*${escapeRegExp(word)})`)
		.join('');

	const regex = new RegExp(`${words}.*`, 'gi');

	return permissionKeys.filter(({ i18nLabels }) => i18nLabels.match(regex)).map(({ _id }) => _id);
};
