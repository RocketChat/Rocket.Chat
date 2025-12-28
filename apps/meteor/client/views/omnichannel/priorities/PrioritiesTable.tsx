import type { ILivechatPriority, Serialized } from '@rocket.chat/core-typings';
import {
	GenericTable,
	GenericTableHeaderCell,
	GenericTableHeader,
	GenericTableBody,
	GenericTableLoadingTable,
} from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import PrioritiesTableRow from './PrioritiesTableRow';
import GenericNoResults from '../../../components/GenericNoResults';

type PrioritiesTableProps = {
	priorities?: Serialized<ILivechatPriority>[];
	onRowClick: (id: string) => void;
	isLoading: boolean;
};

export const PrioritiesTable = ({ priorities, onRowClick, isLoading }: PrioritiesTableProps): ReactElement => {
	const { t } = useTranslation();

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
