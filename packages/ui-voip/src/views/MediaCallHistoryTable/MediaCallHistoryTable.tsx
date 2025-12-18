import type { CallHistoryItemState } from '@rocket.chat/core-typings';
import {
	GenericTable,
	GenericTableHeaderCell,
	GenericTableCell,
	GenericTableRow,
	GenericTableHeader,
	GenericTableBody,
	GenericMenu,
} from '@rocket.chat/ui-client';
import { useLanguage } from '@rocket.chat/ui-contexts';
import { intlFormatDistance } from 'date-fns';
import { useTranslation } from 'react-i18next';

import CallHistoryTableDirection from './CallHistoryTableDirection';
import CallHistoryTableStatus from './CallHistoryTableStatus';
import { CallHistoryInternalUser, CallHistoryExternalUser } from '../../components';

type SortBy = 'contact' | 'type' | 'status' | 'timestamp';

type SortProps = {
	sortBy: SortBy;
	sortDirection: 'asc' | 'desc';
	setSort: (sortBy: SortBy, direction?: 'asc' | 'desc' | undefined) => void;
};

type ExternalContact = {
	number: string;
};

type InternalContact = {
	_id: string;
	username?: string;
	name?: string;
};

type MediaCallHistoryTableProps = {
	sort: SortProps;
	data: Array<{
		_id: string;
		contact: InternalContact | ExternalContact;
		type: 'outbound' | 'inbound';
		status: CallHistoryItemState;
		duration: number;
		timestamp: string;
	}>;
	onClickRow: (historyId: string) => void;
};

const isExternalContact = (contact: InternalContact | ExternalContact): contact is ExternalContact => {
	return 'number' in contact;
};

const MediaCallHistoryTable = ({ sort, data, onClickRow }: MediaCallHistoryTableProps) => {
	const locale = useLanguage();
	const { t } = useTranslation();
	const { sortBy, sortDirection, setSort: onClickSort } = sort;

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
				{data.map(({ _id, contact, type, status, duration, timestamp }) => (
					<GenericTableRow key={_id} onClick={() => onClickRow(_id)} tabIndex={0} role='link' action>
						<GenericTableCell>
							{isExternalContact(contact) ? (
								<CallHistoryExternalUser showIcon={false} number={contact.number} />
							) : (
								<CallHistoryInternalUser username={contact.username ?? ''} name={contact.name} _id={contact._id} />
							)}
						</GenericTableCell>
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

export default MediaCallHistoryTable;
