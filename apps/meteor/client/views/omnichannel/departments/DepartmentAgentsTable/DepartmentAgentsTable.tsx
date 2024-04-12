import { Pagination } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';
import type { Control, UseFormRegister } from 'react-hook-form';
import { useWatch, useFieldArray } from 'react-hook-form';

import { GenericTable, GenericTableBody, GenericTableHeader, GenericTableHeaderCell } from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import type { FormValues } from '../EditDepartment';
import AddAgent from './AddAgent';
import AgentRow from './AgentRow';

type DepartmentAgentsTableProps = {
	control: Control<FormValues>;
	register: UseFormRegister<FormValues>;
};

function DepartmentAgentsTable({ control, register }: DepartmentAgentsTableProps) {
	const t = useTranslation();
	const { fields, append, remove } = useFieldArray({ control, name: 'agentList' });
	const agentList = useWatch({ control, name: 'agentList' });

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const page = useMemo(() => fields.slice(current, current + itemsPerPage), [current, fields, itemsPerPage]);

	return (
		<>
			<AddAgent agentList={agentList} data-qa='DepartmentSelect-AgentsTable' onAdd={append} />

			<GenericTable>
				<GenericTableHeader>
					<GenericTableHeaderCell w='x200'>{t('Name')}</GenericTableHeaderCell>
					<GenericTableHeaderCell w='x140'>{t('Count')}</GenericTableHeaderCell>
					<GenericTableHeaderCell w='x120'>{t('Order')}</GenericTableHeaderCell>
					<GenericTableHeaderCell w='x40'>{t('Remove')}</GenericTableHeaderCell>
				</GenericTableHeader>

				<GenericTableBody>
					{page.map((agent, index) => (
						<AgentRow key={agent.id} index={index} agent={agent} register={register} onRemove={() => remove(index)} />
					))}
				</GenericTableBody>
			</GenericTable>

			<Pagination
				divider
				current={current}
				itemsPerPage={itemsPerPage}
				count={fields.length}
				onSetItemsPerPage={onSetItemsPerPage}
				onSetCurrent={onSetCurrent}
				{...paginationProps}
			/>
		</>
	);
}

export default DepartmentAgentsTable;
