import type { ILivechatPriority, Serialized } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import GenericNoResults from '../../../../client/components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeaderCell,
	GenericTableCell,
	GenericTableRow,
	GenericTableHeader,
	GenericTableBody,
	GenericTableLoadingTable,
} from '../../../../client/components/GenericTable';
import { PriorityIcon } from './PriorityIcon';

type PrioritiesTableProps = {
	priorities?: Serialized<ILivechatPriority>[];
	onRowClick: (id: string) => void;
	isLoading: boolean;
};

export const PrioritiesTable = ({ priorities, onRowClick, isLoading }: PrioritiesTableProps): ReactElement => {
	const t = useTranslation();

	const headers = (
		<>
			<GenericTableHeaderCell key='icon' w='100px'>
				{t('Icon')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='name'>{t('Name')}</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={2} />
					</GenericTableBody>
				</GenericTable>
			)}
			{priorities?.length === 0 && <GenericNoResults />}
			{priorities && priorities?.length > 0 && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						{priorities?.map(({ _id, name, i18n, sortItem, dirty }) => (
							<GenericTableRow key={_id} tabIndex={0} role='link' onClick={(): void => onRowClick(_id)} action qa-row-id={_id}>
								<GenericTableCell withTruncatedText>
									<PriorityIcon level={sortItem} />
								</GenericTableCell>
								<GenericTableCell withTruncatedText>{dirty ? name : i18n}</GenericTableCell>
							</GenericTableRow>
						))}
					</GenericTableBody>
				</GenericTable>
			)}
		</>
	);
};
