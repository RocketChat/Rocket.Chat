import { Box, Select, Label } from '@rocket.chat/fuselage';
import { useMutableCallback, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import React, { Dispatch, FC, SetStateAction, useEffect } from 'react';

import AutoCompleteAgent from '../../../components/AutoCompleteAgent';
import AutoCompleteDepartment from '../../../components/AutoCompleteDepartment';
import { useTranslation } from '../../../contexts/TranslationContext';

type QueueListFilterPropsType = FC<{
	setFilter: Dispatch<SetStateAction<any>>;
}>;

export const QueueListFilter: QueueListFilterPropsType = ({ setFilter, ...props }) => {
	const t = useTranslation();

	const statusOptions: [string, string][] = [
		['online', t('Online')],
		['offline', t('Include_Offline_Agents')],
	];

	const [servedBy, setServedBy] = useLocalStorage('servedBy', 'all');
	const [status, setStatus] = useLocalStorage('status', 'online');
	const [department, setDepartment] = useLocalStorage<{ label: string; value: string }>('department', { value: 'all', label: t('All') });

	const handleServedBy = useMutableCallback((e) => setServedBy(e));
	const handleStatus = useMutableCallback((e) => setStatus(e));
	const handleDepartment = useMutableCallback((e) => setDepartment(e));

	const onSubmit = useMutableCallback((e) => e.preventDefault());

	useEffect(() => {
		const filters = { status } as {
			status: string;
			servedBy?: string;
			departmentId?: string;
		};

		if (servedBy !== 'all') {
			filters.servedBy = servedBy;
		}
		if (department?.value && department.value !== 'all') {
			filters.departmentId = department.value;
		}

		setFilter(filters);
	}, [setFilter, servedBy, status, department]);

	return (
		<Box mb='x16' is='form' onSubmit={onSubmit} display='flex' flexDirection='column' {...props}>
			<Box display='flex' flexDirection='row' flexWrap='wrap' {...props}>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Served_By')}</Label>
					<AutoCompleteAgent haveAll value={servedBy} onChange={handleServedBy} />
				</Box>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Status')}</Label>
					<Select flexShrink={0} options={statusOptions} value={status} onChange={handleStatus} placeholder={t('Status')} />
				</Box>
				<Box display='flex' mie='x8' flexGrow={1} flexDirection='column'>
					<Label mb='x4'>{t('Department')}</Label>
					<AutoCompleteDepartment haveAll value={department} onChange={handleDepartment} label={t('All')} onlyMyDepartments />
				</Box>
			</Box>
		</Box>
	);
};
