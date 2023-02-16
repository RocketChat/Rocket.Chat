import type { ILivechatTrigger, Serialized } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { Dispatch, Key, RefObject, SetStateAction } from 'react';
import React from 'react';

import GenericTable from '../../../components/GenericTable';
import type { GenericTableParams } from '../../../components/GenericTable/GenericTable';
import { useResizeInlineBreakpoint } from '../../../hooks/useResizeInlineBreakpoint';
import TriggersRow from './TriggersRow';

type TriggersTableProps = {
	triggers: Serialized<ILivechatTrigger>[];
	totalTriggers: number;
	params: GenericTableParams;
	onChangeParams: Dispatch<SetStateAction<GenericTableParams>>;
	onDelete: () => void;
};

function TriggersTable({ triggers, totalTriggers, params, onChangeParams, onDelete }: TriggersTableProps) {
	const t = useTranslation();

	const [ref, onMediumBreakpoint] = useResizeInlineBreakpoint([600], 200) as [RefObject<HTMLElement>, boolean];

	return (
		<GenericTable
			ref={ref}
			header={
				<>
					<GenericTable.HeaderCell>{t('Name')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell>{t('Description')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell>{t('Enabled')}</GenericTable.HeaderCell>
					<GenericTable.HeaderCell width='x60'>{t('Remove')}</GenericTable.HeaderCell>
				</>
			}
			results={triggers}
			total={totalTriggers}
			params={params}
			setParams={onChangeParams}
		>
			{(props) => <TriggersRow key={(props as { _id?: Key })._id} onDelete={onDelete} medium={onMediumBreakpoint} {...props} />}
		</GenericTable>
	);
}

export default TriggersTable;
