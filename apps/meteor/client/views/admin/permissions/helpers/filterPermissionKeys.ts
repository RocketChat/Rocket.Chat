import { escapeRegExp } from '@rocket.chat/string-helpers';

export const filterPermissionKeys = (permissionKeys: { _id: string; i18nLabels: string[] }[], filter: string): string[] => {
	const words = escapeRegExp(filter).split(' ').filter(Boolean);
	return permissionKeys
		.filter(({ _id, i18nLabels }) =>
			words.every((word) => _id.toLocaleLowerCase().includes(word) || i18nLabels.join(' ').toLocaleLowerCase().includes(word)),
		)
		.map(({ _id }) => _id);
};
