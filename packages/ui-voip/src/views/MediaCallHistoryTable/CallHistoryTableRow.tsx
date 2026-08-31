import type { CallHistoryItemState } from '@rocket.chat/core-typings';
import { GenericTableCell, GenericTableRow } from '@rocket.chat/ui-client';
import { useLanguage } from '@rocket.chat/ui-contexts';
import { intlFormatDistance } from 'date-fns';
import type { ReactNode } from 'react';

import CallHistoryTableDirection from './CallHistoryTableDirection';
import CallHistoryTableStatus from './CallHistoryTableStatus';
import CallHistoryUser from '../../components/CallHistoryUser';
import type {
	CallHistoryContact,
	CallHistoryExternalContact,
	CallHistoryInternalContact,
	CallHistoryUnknownContact,
} from '../../definitions';

export type CallHistoryTableRowProps<T extends CallHistoryContact> = {
	_id: string;
	contact: T extends CallHistoryInternalContact
		? CallHistoryInternalContact
		: T extends CallHistoryExternalContact
			? CallHistoryExternalContact
			: CallHistoryUnknownContact;
	type: 'outbound' | 'inbound';
	status: CallHistoryItemState;
	duration: number;
	timestamp: string;
	onClick: () => void;
	menu: ReactNode;
};

const CallHistoryTableRow = <T extends CallHistoryContact>({
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
				<CallHistoryUser contact={contact} />
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
