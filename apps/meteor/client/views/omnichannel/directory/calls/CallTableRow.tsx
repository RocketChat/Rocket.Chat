import { IVoipRoom } from '@rocket.chat/core-typings';
import { Table } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import React, { ReactElement, useCallback } from 'react';

import { parseOutboundPhoneNumber } from '../../../../../ee/client/lib/voip/parseOutboundPhoneNumber';
import { useIsCallReady } from '../../../../contexts/CallContext';
import { CallDialpadButton } from '../CallDialpadButton';

type CallTableRowProps = {
	room: IVoipRoom;
	onRowClick(_id: string, token?: string): void;
};

export const CallTableRow = ({ room, onRowClick }: CallTableRowProps): ReactElement => {
	const t = useTranslation();
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
		<Table.Row
			key={_id}
			rcx-show-call-button-on-hover
			tabIndex={0}
			role='link'
			onClick={(): void => onRowClick(_id, v?.token)}
			action
			qa-user-id={_id}
			height='40px'
		>
			<Table.Cell withTruncatedText>{parseOutboundPhoneNumber(fname)}</Table.Cell>
			<Table.Cell withTruncatedText>{parseOutboundPhoneNumber(phoneNumber)}</Table.Cell>
			<Table.Cell withTruncatedText>{queue}</Table.Cell>
			<Table.Cell withTruncatedText>{moment(callStarted).format('L LTS')}</Table.Cell>
			<Table.Cell withTruncatedText>{duration.isValid() && duration.humanize()}</Table.Cell>
			<Table.Cell withTruncatedText>{resolveDirectionLabel(direction)}</Table.Cell>
			<Table.Cell>{isCallReady && <CallDialpadButton phoneNumber={phoneNumber} />}</Table.Cell>
		</Table.Row>
	);
};
