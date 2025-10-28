import type { IPermission } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { TFunction } from 'i18next';

export const mapPermissionKeys = ({ t, permissions }: { t: TFunction; permissions: IPermission[] }) =>
	permissions.map(({ _id, settingId, group, section }) => ({
		_id,
		i18nLabels: [group && t(group), section && t(section), settingId && t(settingId), t(_id)].filter(Boolean) as string[],
	}));

export const filterPermissionKeys = (permissionKeys: { _id: string; i18nLabels: string[] }[], filter: string): string[] => {
	const words = escapeRegExp(filter).split(' ').filter(Boolean);
	return permissionKeys
		.filter(({ _id, i18nLabels }) =>
			words.every(
				(word) =>
					_id.toLocaleLowerCase().includes(word.toLocaleLowerCase()) ||
					i18nLabels.join(' ').toLocaleLowerCase().includes(word.toLocaleLowerCase()),
			),
		)
		.map(({ _id }) => _id);
};
