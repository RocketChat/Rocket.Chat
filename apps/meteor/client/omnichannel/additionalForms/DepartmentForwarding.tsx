import { Field, FieldLabel, FieldRow, FieldHint, Box, PaginatedMultiSelectFiltered, CheckOption } from '@rocket.chat/fuselage';
import type { PaginatedMultiSelectOption } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useInfiniteDepartmentsList } from '../../components/Omnichannel/hooks/useInfiniteDepartmentsList';
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

	const {
		data: departmentsItems = [],
		fetchNextPage,
		hasNextPage,
	} = useInfiniteDepartmentsList(
		useMemo(() => ({ filter: departmentsFilter, departmentId, showArchived: true }), [departmentId, departmentsFilter]),
	);

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
						endReached={hasNextPage ? () => fetchNextPage() : () => undefined}
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
