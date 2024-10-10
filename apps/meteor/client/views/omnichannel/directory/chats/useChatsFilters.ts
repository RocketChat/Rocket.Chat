import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useFormatDate } from '../../../../hooks/useFormatDate';

export type ChatsFiltersQuery = {
	guest: string;
	servedBy: string;
	status: string;
	department: string;
	from: string;
	to: string;
	tags: { _id: string; label: string; value: string }[];
	[key: string]: unknown;
};

const initialValues: ChatsFiltersQuery = {
	guest: '',
	servedBy: 'all',
	status: 'all',
	department: 'all',
	from: '',
	to: '',
	tags: [],
};

const useDisplayFilters = (filtersQuery: ChatsFiltersQuery) => {
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
		status: status !== 'all' ? `${t('Status')}: ${status}` : undefined,
		tags: tags.length > 0 ? tags.map((tag) => `${t('Tag')}: ${tag.label}`) : undefined,
		...displayCustomFields,
	};
};

export const useChatsFilters = () => {
	const [filtersQuery, setFiltersQuery] = useLocalStorage('conversationsQuery', initialValues);
	const displayFilters = useDisplayFilters(filtersQuery);

	const resetFiltersQuery = () =>
		setFiltersQuery((prevState) => {
			const customFields = Object.keys(prevState).filter((item) => !Object.keys(initialValues).includes(item));

			const initialCustomFields = customFields.reduce((acc, cv) => {
				acc[cv] = '';
				return acc;
			}, {} as { [key: string]: string });

			return { ...initialValues, ...initialCustomFields };
		});

	const removeFilter = (filter: keyof typeof initialValues) =>
		setFiltersQuery((prevState) => ({ ...prevState, [filter]: initialValues[filter] }));

	return { filtersQuery, setFiltersQuery, resetFiltersQuery, displayFilters, removeFilter };
};
