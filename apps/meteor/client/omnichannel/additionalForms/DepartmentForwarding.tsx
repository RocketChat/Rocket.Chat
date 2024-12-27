import { Field, FieldLabel, FieldRow, FieldHint, Box, PaginatedMultiSelectFiltered, CheckOption } from '@rocket.chat/fuselage';
import type { PaginatedMultiSelectOption } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDepartmentsList } from '../../components/Omnichannel/hooks/useDepartmentsList';
import { useRecordList } from '../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../hooks/useAsyncState';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

type DepartmentForwardingProps = {
	departmentId: string;
	value?: PaginatedMultiSelectOption[];
	handler: (value: PaginatedMultiSelectOption[]) => void;
	label: TranslationKey;
};

export const DepartmentForwarding = ({ departmentId, value = [], handler, label }: DepartmentForwardingProps) => {
	const { t } = useTranslation();
	const [departmentsFilter, setDepartmentsFilter] = useState('');
	const hasLicense = useHasLicenseModule('livechat-enterprise');

	const debouncedDepartmentsFilter = useDebouncedValue(departmentsFilter, 500);

	const { itemsList: departmentsList, loadMoreItems: loadMoreDepartments } = useDepartmentsList(
		useMemo(() => ({ filter: departmentsFilter, departmentId, showArchived: true }), [departmentId, departmentsFilter]),
	);

	const { phase: departmentsPhase, items: departmentsItems, itemCount: departmentsTotal } = useRecordList(departmentsList);

	const options = useMemo(() => {
		const pending = value.filter(({ value }) => !departmentsItems.find((dep) => dep.value === value));
		return [...departmentsItems, ...pending];
	}, [departmentsItems, value]);

	if (!hasLicense) {
		return null;
	}

	return (
		<Field>
			<FieldLabel>{t(label)}</FieldLabel>
			<FieldRow>
				<Box w='100%'>
					<PaginatedMultiSelectFiltered
						withTitle
						maxWidth='100%'
						w='100%'
						flexGrow={1}
						filter={debouncedDepartmentsFilter}
						setFilter={setDepartmentsFilter}
						onChange={handler}
						options={options}
						value={value}
						placeholder={t('Select_an_option')}
						endReached={
							departmentsPhase === AsyncStatePhase.LOADING
								? () => undefined
								: (start?: number) => {
										if (start === undefined) {
											return;
										}
										loadMoreDepartments(start, Math.min(50, departmentsTotal));
									}
						}
						renderItem={({ label, ...props }) => (
							<CheckOption
								{...props}
								label={<span style={{ whiteSpace: 'normal' }}>{label}</span>}
								selected={value.some((item) => item.value === props.value)}
							/>
						)}
					/>
				</Box>
			</FieldRow>
			<FieldHint>{t('List_of_departments_for_forward_description')}</FieldHint>
		</Field>
	);
};

export default DepartmentForwarding;
