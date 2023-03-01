import { Field, Box, PaginatedMultiSelectFiltered } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FormEventHandler } from 'react';
import React, { useMemo, useState } from 'react';

import { useDepartmentsList } from '../../../../client/components/Omnichannel/hooks/useDepartmentsList';
import { useRecordList } from '../../../../client/hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';

type DepartmentForwardingProps = {
	departmentId: string;
	value?: string;
	handler: FormEventHandler<HTMLElement>;
	label: TranslationKey;
};

export const DepartmentForwarding = ({ departmentId, value, handler, label }: DepartmentForwardingProps) => {
	const t = useTranslation();
	const [departmentsFilter, setDepartmentsFilter] = useState('');

	const debouncedDepartmentsFilter = useDebouncedValue(departmentsFilter, 500);

	const { itemsList: departmentsList, loadMoreItems: loadMoreDepartments } = useDepartmentsList(
		useMemo(() => ({ filter: departmentsFilter, departmentId, showArchived: true }), [departmentId, departmentsFilter]),
	);

	const { phase: departmentsPhase, items: departmentsItems, itemCount: departmentsTotal } = useRecordList(departmentsList);

	return (
		<Field>
			<Field.Label>{t(label)}</Field.Label>
			<Field.Row>
				<Box w='100%'>
					<PaginatedMultiSelectFiltered
						withTitle
						maxWidth='100%'
						w='100%'
						flexGrow={1}
						filter={debouncedDepartmentsFilter}
						setFilter={setDepartmentsFilter as (type?: string | number) => void}
						onChange={handler}
						options={departmentsItems}
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
					/>
				</Box>
			</Field.Row>
			<Field.Hint>{t('List_of_departments_for_forward_description')}</Field.Hint>
		</Field>
	);
};

export default DepartmentForwarding;
