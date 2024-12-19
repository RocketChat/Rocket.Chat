import type { EndpointFunction, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { QueryClient } from '@tanstack/react-query';
import type { useTranslation } from 'react-i18next';

import type { DepartmentListItem } from '../Definitions/DepartmentsDefinitions';
import type { DepartmentsListOptions } from '../hooks/useDepartmentsList';

type normalizeDepartmentsProps = {
	departments: DepartmentListItem[];
	options: DepartmentsListOptions;
	getDepartment: EndpointFunction<'GET', '/v1/livechat/department/:_id'>;
	dispatchToastMessage: ReturnType<typeof useToastMessageDispatch>;
	t: ReturnType<typeof useTranslation>['t'];
	queryClient: QueryClient;
};

export const normalizeDepartments = async ({
	departments,
	options,
	getDepartment,
	dispatchToastMessage,
	t,
	queryClient,
}: normalizeDepartmentsProps): Promise<DepartmentListItem[]> => {
	const { haveAll, haveNone, selectedDepartment, onChange: setDepartment } = options;
	const departmentsList = [...departments];

	if (haveAll) {
		departmentsList.unshift({
			_id: '',
			label: t('All'),
			value: 'all',
		});
	}

	if (haveNone) {
		departmentsList.unshift({
			_id: '',
			label: t('None'),
			value: '',
		});
	}

	const isDepartmentInvalidOrAlreadyOnList =
		!selectedDepartment || selectedDepartment === 'all' || departmentsList.some((department) => department._id === selectedDepartment);
	if (isDepartmentInvalidOrAlreadyOnList) {
		return departmentsList;
	}

	try {
		const data = await queryClient.ensureQueryData(['/v1/livechat/department/:_id', selectedDepartment], async () => getDepartment({}));
		if (!!setDepartment && !data?.department) {
			setDepartment('all');
			dispatchToastMessage({
				type: 'info',
				message: t('The_selected_department_no_longer_exists'),
			});

			return departmentsList;
		}

		const { _id, name } = data.department;

		return [...departmentsList, { _id, label: name, value: _id }];
	} catch (error) {
		dispatchToastMessage({ type: 'error', message: error });

		return departmentsList;
	}
};
