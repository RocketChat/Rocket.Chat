import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import type { Control, UseFormRegister } from 'react-hook-form';
import { useWatch, useFieldArray } from 'react-hook-form';

import { GenericTable, GenericTableBody, GenericTableHeader, GenericTableHeaderCell } from '../../../../components/GenericTable';
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
					{fields.map((agent, index) => (
						<AgentRow key={agent.id} index={index} agent={agent} register={register} onRemove={() => remove(index)} />
					))}
				</GenericTableBody>
			</GenericTable>
		</>
	);
}

export default DepartmentAgentsTable;
