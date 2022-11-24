import { ILivechatPriority, Serialized } from '@rocket.chat/core-typings';
import { PaginatedResult } from '@rocket.chat/rest-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback, useMemo } from 'react';

import GenericTable, { GenericTableCell, GenericTableRow } from '../../../../client/components/GenericTable';

type PrioritiesTableProps = {
	data?: Serialized<PaginatedResult<{ priorities: ILivechatPriority[] }>>;
	onRowClick: (id: string) => void;
};

export const PrioritiesTable = ({ data, onRowClick }: PrioritiesTableProps): ReactElement => {
	const t = useTranslation();

	const renderRow = useCallback(
		({ _id, icon, name, i18n, dirty }) => (
			<GenericTableRow key={_id} tabIndex={0} role='link' onClick={(): void => onRowClick(_id)} action qa-row-id={_id}>
				<GenericTableCell withTruncatedText>{icon}</GenericTableCell>
				<GenericTableCell withTruncatedText>{dirty ? name : t(i18n)}</GenericTableCell>
			</GenericTableRow>
		),
		[onRowClick, t],
	);

	const header = useMemo(
		() => [
			<GenericTable.HeaderCell key='icon' w='100px'>
				{t('Icon')}
			</GenericTable.HeaderCell>,
			<GenericTable.HeaderCell key='name'>{t('Name')}</GenericTable.HeaderCell>,
		],
		[t],
	);

	return <GenericTable results={data?.priorities} header={header} renderRow={renderRow} pagination={false} />;
};
