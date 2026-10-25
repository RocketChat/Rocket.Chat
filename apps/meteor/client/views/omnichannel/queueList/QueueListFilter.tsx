import { Box, Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import { useStableCallback, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { Dispatch, FormEvent, Key, SetStateAction } from 'react';
import { useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';

import AutoCompleteAgent from '../components/AutoCompleteAgent';
import AutoCompleteDepartment from '../components/AutoCompleteDepartment';

export type QueueListFilterProps = {
	setFilter: Dispatch<SetStateAction<any>>;
};

export const QueueListFilter = ({ setFilter, ...props }: QueueListFilterProps) => {
	const { t } = useTranslation();

	const statusOptions: [string, string][] = [
		['online', t('Online')],
		['offline', t('Include_Offline_Agents')],
	];

	const servedByLabelId = useId();
	const statusLabelId = useId();
	const departmentLabelId = useId();

	const [servedBy, setServedBy] = useLocalStorage('servedBy', 'all');
	const [status, setStatus] = useLocalStorage('status', 'online');
	const [department, setDepartment] = useLocalStorage<string>('department', 'all');

	const handleServedBy = useStableCallback((e: string) => setServedBy(e));
	const handleStatus = useStableCallback((e: Key) => setStatus(e as string));
	const handleDepartment = useStableCallback((e: string) => setDepartment(e));

	const onSubmit = useStableCallback((e: FormEvent) => e.preventDefault());

	useEffect(() => {
		const filters = { status } as {
			status: string;
			servedBy?: string;
			departmentId?: string;
		};

		if (servedBy !== 'all') {
			filters.servedBy = servedBy;
		}
		if (department && department !== 'all') {
			filters.departmentId = department;
		}

		setFilter(filters);
	}, [setFilter, servedBy, status, department]);

	return (
		<Box marginBlock={16} is='form' onSubmit={onSubmit} display='flex' flexDirection='column' {...props}>
			<Box display='flex' flexDirection='row' flexWrap='wrap' columnGap={8} paddingInlineEnd={8} {...props}>
				<Box flexGrow={1}>
					<Field>
						<FieldLabel id={servedByLabelId}>{t('Served_By')}</FieldLabel>
						<FieldRow>
							<AutoCompleteAgent aria-labelledby={servedByLabelId} haveAll value={servedBy} onChange={handleServedBy} />
						</FieldRow>
					</Field>
				</Box>
				<Box flexGrow={1}>
					<Field>
						<FieldLabel id={statusLabelId}>{t('Status')}</FieldLabel>
						<FieldRow>
							<Select
								aria-labelledby={statusLabelId}
								options={statusOptions}
								value={status}
								onChange={handleStatus}
								placeholder={t('Status')}
							/>
						</FieldRow>
					</Field>
				</Box>
				<Box flexGrow={1}>
					<Field>
						<FieldLabel id={departmentLabelId}>{t('Department')}</FieldLabel>
						<FieldRow>
							<AutoCompleteDepartment
								aria-labelledby={departmentLabelId}
								haveAll
								value={department}
								onChange={handleDepartment}
								onlyMyDepartments
							/>
						</FieldRow>
					</Field>
				</Box>
			</Box>
		</Box>
	);
};
