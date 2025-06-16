import { Pagination } from '@rocket.chat/fuselage';
import type { AriaAttributes } from 'react';
import { useMemo } from 'react';
import type { Control, UseFormRegister } from 'react-hook-form';
import { useWatch, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { GenericTable, GenericTableBody, GenericTableHeader, GenericTableHeaderCell } from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import type { EditDepartmentFormData } from '../definitions';
import AddAgent from './AddAgent';
import AgentRow from './AgentRow';

type DepartmentAgentsTableProps = Pick<AriaAttributes, 'aria-labelledby'> & {
	control: Control<EditDepartmentFormData>;
	register: UseFormRegister<EditDepartmentFormData>;
};

function DepartmentAgentsTable({ control, register, 'aria-labelledby': ariaLabelledBy }: DepartmentAgentsTableProps) {
	const { t } = useTranslation();
	const { fields, append, remove } = useFieldArray({ control, name: 'agentList' });
	const agentList = useWatch({ control, name: 'agentList' });

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const page = useMemo(() => fields.slice(current, current + itemsPerPage), [current, fields, itemsPerPage]);

	return (
		<>
			<AddAgent aria-labelledby={ariaLabelledBy} agentList={agentList} data-qa='DepartmentSelect-AgentsTable' onAdd={append} />

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
