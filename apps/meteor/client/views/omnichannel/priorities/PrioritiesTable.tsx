import type { ILivechatPriority, Serialized } from '@rocket.chat/core-typings';
import type { TableColumnWidth } from '@rocket.chat/fuselage';
import {
	GenericTable,
	GenericTableHeaderCell,
	GenericTableHeader,
	GenericTableBody,
	GenericTableLoadingTable,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import PrioritiesTableRow from './PrioritiesTableRow';

export type PrioritiesTableProps = {
	priorities?: Serialized<ILivechatPriority>[];
	onRowClick: (id: string) => void;
	isLoading: boolean;
};

export const PrioritiesTable = ({ priorities, onRowClick, isLoading }: PrioritiesTableProps) => {
	const { t } = useTranslation();

	const columns: TableColumnWidth[] = ['100px'];

	const headers = (
		<>
			<GenericTableHeaderCell key='icon'>{t('Icon')}</GenericTableHeaderCell>
			<GenericTableHeaderCell key='name'>{t('Name')}</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			{isLoading && (
				<GenericTable columns={columns}>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={2} />
					</GenericTableBody>
				</GenericTable>
			)}
			{priorities?.length === 0 && <GenericNoResults />}
			{priorities && priorities?.length > 0 && (
				<GenericTable columns={columns} aria-label={t('Priorities')}>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						{priorities?.map(({ _id, name, i18n, sortItem, dirty }) => (
							<PrioritiesTableRow
								key={_id}
								id={_id}
								name={name}
								i18n={i18n}
								sortItem={sortItem}
								dirty={dirty}
								onClick={() => onRowClick(_id)}
							/>
						))}
					</GenericTableBody>
				</GenericTable>
			)}
		</>
	);
};
