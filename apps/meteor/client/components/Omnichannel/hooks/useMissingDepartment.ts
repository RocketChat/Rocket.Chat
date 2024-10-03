import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { dispatchToastMessage } from '../../../lib/toast';
import type { DepartmentListItem } from './useDepartmentsList';

export const useMissingDepartment = (
	selectedDepartment: string,
	setDepartment: (value: string) => void | undefined,
): DepartmentListItem | undefined => {
	const getDepartment = useEndpoint('GET', '/v1/livechat/department/:_id', { _id: selectedDepartment });

	const { data } = useQuery(
		['missing-department', selectedDepartment],
		async () => {
			const result = await getDepartment({});

			if (!result?.department) {
				throw new Error('Department not found!');
			}

			return { _id: result.department._id, label: result.department.name, value: result.department._id };
		},
		{
			enabled: !!selectedDepartment && selectedDepartment !== 'all',
			onError: () => {
				setDepartment('all');
				dispatchToastMessage({ type: 'info', message: 'The selected department was deleted and the departments filter reseted to All' });
			},
		},
	);

	return data;
};
