import type { CallHistoryItemState } from '@rocket.chat/core-typings';
import { GenericTableCell, GenericTableRow } from '@rocket.chat/ui-client';
import { useLanguage } from '@rocket.chat/ui-contexts';
import { intlFormatDistance } from 'date-fns';
import type { ReactNode } from 'react';

import CallHistoryTableDirection from './CallHistoryTableDirection';
import CallHistoryTableStatus from './CallHistoryTableStatus';
import CallHistoryTableUnknownContact from './CallHistoryTableUnknownContact';
import { CallHistoryExternalUser, CallHistoryInternalUser } from '../../components';

export type CallHistoryTableExternalContact = {
	number: string;
};

export type CallHistoryTableInternalContact = {
	_id: string;
	username?: string;
	name?: string;
};

export type CallHistoryUnknownContact = {
	unknown: true;
};

type CallHistoryTableRowContact = CallHistoryTableInternalContact | CallHistoryTableExternalContact | CallHistoryUnknownContact;

export type CallHistoryTableRowProps<T extends CallHistoryTableRowContact> = {
	_id: string;
	contact: T extends CallHistoryTableInternalContact
		? CallHistoryTableInternalContact
		: T extends CallHistoryTableExternalContact
			? CallHistoryTableExternalContact
			: CallHistoryUnknownContact;
	type: 'outbound' | 'inbound';
	status: CallHistoryItemState;
	duration: number;
	timestamp: string;
	onClick: () => void;
	menu: ReactNode;
};

export const isCallHistoryTableExternalContact = (contact: CallHistoryTableRowContact): contact is CallHistoryTableExternalContact => {
	return 'number' in contact;
};

export const isCallHistoryUnknownContact = (contact: CallHistoryTableRowContact): contact is CallHistoryUnknownContact => {
	return 'unknown' in contact;
};

export const isCallHistoryTableInternalContact = (contact: CallHistoryTableRowContact): contact is CallHistoryTableInternalContact => {
	return '_id' in contact && ('username' in contact || 'name' in contact);
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
				{isCallHistoryTableExternalContact(contact) && <CallHistoryExternalUser showIcon={false} number={contact.number} />}
				{isCallHistoryTableInternalContact(contact) && (
					<CallHistoryInternalUser username={contact.username ?? ''} name={contact.name} _id={contact._id} />
				)}
				{isCallHistoryUnknownContact(contact) && <CallHistoryTableUnknownContact />}
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
