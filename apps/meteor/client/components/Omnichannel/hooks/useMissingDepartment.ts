import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { dispatchToastMessage } from '../../../lib/toast';
import type { DepartmentListItem } from '../Definitions/DepartmentsDefinitions';

export const useMissingDepartment = (
	selectedDepartment: string,
	setDepartment: (value: string) => void,
): DepartmentListItem | undefined => {
	const { t } = useTranslation();

	const getDepartment = useEndpoint('GET', '/v1/livechat/department/:_id', { _id: selectedDepartment });

	const { data } = useQuery(
		['missing-department', selectedDepartment],
		async () => {
			const result = await getDepartment({});

			if (!result?.department) {
				throw new Error('Department not found!');
			}

			const { _id, name } = result.department;

			return { _id, label: name, value: _id };
		},
		{
			enabled: !!selectedDepartment && selectedDepartment !== 'all',
			onError: () => {
				setDepartment('all');
				dispatchToastMessage({
					type: 'info',
					message: t('The_selected_department_has_been_deleted'),
				});
			},
		},
	);

	return data;
};
