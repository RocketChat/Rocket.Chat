import type { IVoipRoom, Serialized } from '@rocket.chat/core-typings';
import moment from 'moment';
import type { ReactElement } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericTableRow, GenericTableCell } from '../../../../components/GenericTable';
import { useIsCallReady } from '../../../../contexts/CallContext';
import { parseOutboundPhoneNumber } from '../../../../lib/voip/parseOutboundPhoneNumber';
import { CallDialpadButton } from '../components/CallDialpadButton';

type CallTableRowProps = {
	room: Serialized<IVoipRoom>;
	onRowClick(_id: string, token?: string): void;
};

export const CallTableRow = ({ room, onRowClick }: CallTableRowProps): ReactElement => {
	const { t } = useTranslation();
	const isCallReady = useIsCallReady();

	const { _id, fname, callStarted, queue, callDuration = 0, v, direction } = room;
	const duration = moment.duration(callDuration / 1000, 'seconds');
	const phoneNumber = Array.isArray(v?.phone) ? v?.phone[0]?.phoneNumber : v?.phone;

	const resolveDirectionLabel = useCallback(
		(direction: IVoipRoom['direction']) => {
			const labels = {
				inbound: 'Incoming',
				outbound: 'Outgoing',
			} as const;
			return t(labels[direction] || 'Not_Available');
		},
		[t],
	);

	return (
		<GenericTableRow
			key={_id}
			rcx-show-call-button-on-hover
			tabIndex={0}
			role='link'
			onClick={(): void => onRowClick(_id, v?.token)}
			action
			qa-user-id={_id}
			height='40px'
		>
			<GenericTableCell withTruncatedText>{parseOutboundPhoneNumber(fname)}</GenericTableCell>
			<GenericTableCell withTruncatedText>{parseOutboundPhoneNumber(phoneNumber)}</GenericTableCell>
			<GenericTableCell withTruncatedText>{queue}</GenericTableCell>
			<GenericTableCell withTruncatedText>{moment(callStarted).format('L LTS')}</GenericTableCell>
			<GenericTableCell withTruncatedText>{duration.isValid() && duration.humanize()}</GenericTableCell>
			<GenericTableCell withTruncatedText>{resolveDirectionLabel(direction)}</GenericTableCell>
			<GenericTableCell>{isCallReady && <CallDialpadButton phoneNumber={phoneNumber} />}</GenericTableCell>
		</GenericTableRow>
	);
};
