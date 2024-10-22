import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useFormatDate } from '../../../../hooks/useFormatDate';
import type { ChatsFiltersQuery } from './ChatsContext';

const statusTextMap: { [key: string]: string } = {
	all: 'All',
	closed: 'Closed',
	opened: 'Room_Status_Open',
	onhold: 'On_Hold_Chats',
	queued: 'Queued',
};

export const useDisplayFilters = (filtersQuery: ChatsFiltersQuery) => {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const { guest, servedBy, status, department, from, to, tags, ...customFields } = filtersQuery;

	const getDepartment = useEndpoint('GET', '/v1/livechat/department/:_id', { _id: department });
	const getAgent = useEndpoint('GET', '/v1/livechat/users/agent/:_id', { _id: servedBy });

	const { data: departmentData } = useQuery(['getDepartmentDataForFilter', department], () => getDepartment({}));
	const { data: agentData } = useQuery(['getAgentDataForFilter', servedBy], () => getAgent());

	const displayCustomFields = Object.entries(customFields).reduce((acc, [key, value]) => {
		acc[key] = value ? `${key}: ${value}` : undefined;
		return acc;
	}, {} as { [key: string]: string | undefined });

	return {
		from: from !== '' ? `${t('From')}: ${formatDate(from)}` : undefined,
		to: to !== '' ? `${t('To')}: ${formatDate(to)}` : undefined,
		guest: guest !== '' ? `${t('Text')}: ${guest}` : undefined,
		servedBy: servedBy !== 'all' ? `${t('Served_By')}: ${agentData?.user.name}` : undefined,
		department: department !== 'all' ? `${t('Department')}: ${departmentData?.department.name}` : undefined,
		status: status !== 'all' ? `${t('Status')}: ${t(statusTextMap[status] as TranslationKey)}` : undefined,
		tags: tags.length > 0 ? tags.map((tag) => `${t('Tag')}: ${tag.label}`) : undefined,
		...displayCustomFields,
	};
};
