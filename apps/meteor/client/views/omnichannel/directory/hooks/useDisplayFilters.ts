import type { PaginatedMultiSelectOption } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useFormatDate } from '../../../../hooks/useFormatDate';
import type { ChatsFiltersQuery } from '../contexts/ChatsContext';

const statusTextMap: { [key: string]: TranslationKey } = {
	all: 'All',
	closed: 'Closed',
	opened: 'Room_Status_Open',
	onhold: 'On_Hold_Chats',
	queued: 'Queued',
};

export const useDisplayFilters = (filtersQuery: ChatsFiltersQuery) => {
	const { t } = useTranslation();
	const formatDate = useFormatDate();

	const { guest, servedBy, status, department, from, to, tags, units, ...customFields } = filtersQuery;

	const displayCustomFields = Object.entries(customFields).reduce(
		(acc, [key, value]) => {
			acc[key] = value ? `${key}: ${value}` : undefined;
			return acc;
		},
		{} as { [key: string]: string | undefined },
	);

	return {
		from: from !== '' ? `${t('From')}: ${formatDate(from)}` : undefined,
		to: to !== '' ? `${t('To')}: ${formatDate(to)}` : undefined,
		guest: guest !== '' ? `${t('Text')}: ${guest}` : undefined,
		servedBy: servedBy.length ? `${t('Served_By')}: ${parseMultiSelect(servedBy)}` : undefined,
		department: department.length ? `${t('Department')}: ${parseMultiSelect(department)}` : undefined,
		status: status !== 'all' ? `${t('Status')}: ${t(statusTextMap[status])}` : undefined,
		tags: tags.length > 0 ? `${t('Tags')}: ${tags.map((tag) => tag.label).join(', ')}` : undefined,
		units: units?.length ? `${t('Units')}: ${parseMultiSelect(units)}` : undefined,
		...displayCustomFields,
	};
};

const parseMultiSelect = (data: PaginatedMultiSelectOption[]) => {
	return data.map((a) => (a.label as string).split(' (')[0]).join(', ');
};
