import type { CallHistoryItemState } from '@rocket.chat/core-typings';
import {
	GenericTable,
	GenericTableHeaderCell,
	GenericTableCell,
	GenericTableRow,
	GenericTableHeader,
	GenericTableBody,
	GenericMenu,
	// GenericTableLoadingTable,
} from '@rocket.chat/ui-client';
import { useLanguage } from '@rocket.chat/ui-contexts';
// import { useUserCard } from '@rocket.chat/ui-contexts';
import { intlFormatDistance } from 'date-fns';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import CallHistoryTableDirection from './CallHistoryTableDirection';
import CallHistoryTableStatus from './CallHistoryTableStatus';

type SortBy = 'contact' | 'type' | 'status' | 'timestamp';

type SortProps = {
	sortBy: SortBy;
	sortDirection: 'asc' | 'desc';
	setSort: (sortBy: SortBy, direction?: 'asc' | 'desc' | undefined) => void;
};

type MediaCallHistoryPageProps = {
	sort: SortProps;
	data: Array<{ contact: string; type: 'outbound' | 'inbound'; status: CallHistoryItemState; duration: number; timestamp: string }>;
};

const MediaCallHistoryPage = ({ sort, data }: MediaCallHistoryPageProps) => {
	const locale = useLanguage();
	const { t } = useTranslation();
	const { sortBy, sortDirection, setSort: onClickSort } = sort;
	// const { openUserCard } = useUserCard();
	const openContextualBar = useCallback((e: React.MouseEvent<HTMLTableRowElement>) => {
		e.preventDefault();
		console.log('openContextualBar');
	}, []);

	const openUserCard = useCallback((e: React.MouseEvent<HTMLTableRowElement>) => {
		e.preventDefault();
		e.stopPropagation();
		console.log('openUserCard');
		// openUserCard(e, contact);
	}, []);

	return (
		<GenericTable>
			<GenericTableHeader>
				<GenericTableHeaderCell key='contact' sort='contact' onClick={onClickSort} active={sortBy === 'contact'} direction={sortDirection}>
					{t('Contact')}
				</GenericTableHeaderCell>
				<GenericTableHeaderCell key='type' sort='type' onClick={onClickSort} active={sortBy === 'type'} direction={sortDirection}>
					{t('Type')}
				</GenericTableHeaderCell>
				<GenericTableHeaderCell key='status' sort='status' onClick={onClickSort} active={sortBy === 'status'} direction={sortDirection}>
					{t('Status')}
				</GenericTableHeaderCell>
				<GenericTableHeaderCell
					key='timestamp'
					sort='timestamp'
					onClick={onClickSort}
					active={sortBy === 'timestamp'}
					direction={sortDirection}
				>
					{t('Time_slash_Date')}
				</GenericTableHeaderCell>
				<GenericTableHeaderCell key='menu' width={44} />
			</GenericTableHeader>
			<GenericTableBody>
				{data.map(({ contact, type, status, duration, timestamp }) => (
					<GenericTableRow key={contact} onClick={openContextualBar}>
						<GenericTableCell onClick={openUserCard}>{contact}</GenericTableCell>
						<GenericTableCell>
							<CallHistoryTableDirection direction={type} />
						</GenericTableCell>
						<GenericTableCell>
							<CallHistoryTableStatus status={status} duration={duration} />
						</GenericTableCell>
						<GenericTableCell>{intlFormatDistance(new Date(timestamp), new Date(), { locale: locale ?? 'en-US' })}</GenericTableCell>
						<GenericTableCell>
							<GenericMenu title='Menu' sections={[]} />
						</GenericTableCell>
					</GenericTableRow>
				))}
			</GenericTableBody>
		</GenericTable>
	);
};

export default MediaCallHistoryPage;
