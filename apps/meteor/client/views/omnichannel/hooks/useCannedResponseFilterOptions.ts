import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const useCannedResponseFilterOptions = (): string[][] => {
	const { t } = useTranslation();
	const getDepartments = useEndpoint('GET', '/v1/livechat/department');

	const defaultOptions = useMemo(
		() => [
			['all', t('All')],
			['global', t('Public')],
			['user', t('Private')],
		],
		[t],
	);

	const { data: departmentOptions = [] } = useQuery({
		queryKey: ['livechat-departments', { text: '' }],
		queryFn: () => getDepartments({ text: '' }),
		select: ({ departments }) => departments.map((department) => [department._id, department.name]),
	});

	return useMemo(() => defaultOptions.concat(departmentOptions), [defaultOptions, departmentOptions]);
};
