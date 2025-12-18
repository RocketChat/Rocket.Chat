import type { CallHistoryItemState } from '@rocket.chat/core-typings';
import { GenericTableCell, GenericTableRow } from '@rocket.chat/ui-client';
import { useLanguage } from '@rocket.chat/ui-contexts';
import { intlFormatDistance } from 'date-fns';
import type { ReactNode } from 'react';

import CallHistoryTableDirection from './CallHistoryTableDirection';
import CallHistoryTableStatus from './CallHistoryTableStatus';
import { CallHistoryExternalUser, CallHistoryInternalUser } from '../../components';

export type CallHistoryTableExternalContact = {
	number: string;
};

export type CallHistoryTableInternalContact = {
	_id: string;
	username?: string;
	name?: string;
};

type CallHistoryTableRowContact = CallHistoryTableInternalContact | CallHistoryTableExternalContact;

export type CallHistoryTableRowProps<T extends CallHistoryTableRowContact> = {
	_id: string;
	contact: T extends CallHistoryTableInternalContact ? CallHistoryTableInternalContact : CallHistoryTableExternalContact;
	type: 'outbound' | 'inbound';
	status: CallHistoryItemState;
	duration: number;
	timestamp: string;
	onClick: () => void;
	menu: ReactNode;
};

export const isCallHistoryTableExternalContact = (
	contact: CallHistoryTableInternalContact | CallHistoryTableExternalContact,
): contact is CallHistoryTableExternalContact => {
	return 'number' in contact;
};

const CallHistoryTableRow = <T extends CallHistoryTableRowContact>({
	_id,
	contact,
	type,
	status,
	duration,
	timestamp,
	onClick,
	menu,
}: CallHistoryTableRowProps<T>) => {
	const locale = useLanguage();
	return (
		<GenericTableRow key={_id} onClick={onClick} tabIndex={0} role='link' action>
			<GenericTableCell>
				{isCallHistoryTableExternalContact(contact) ? (
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
			<GenericTableCell>{menu}</GenericTableCell>
		</GenericTableRow>
	);
};

export default CallHistoryTableRow;
