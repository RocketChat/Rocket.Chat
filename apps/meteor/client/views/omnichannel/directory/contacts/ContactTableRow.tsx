import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { ILivechatContactWithManagerData } from '@rocket.chat/rest-typings';
import { useRoute } from '@rocket.chat/ui-contexts';
import React from 'react';

import { GenericTableCell, GenericTableRow } from '../../../../components/GenericTable';
import { OmnichannelRoomIcon } from '../../../../components/RoomIcon/OmnichannelRoomIcon';
import { useIsCallReady } from '../../../../contexts/CallContext';
import { useTimeFromNow } from '../../../../hooks/useTimeFromNow';
import { useOmnichannelSource } from '../../hooks/useOmnichannelSource';
import { CallDialpadButton } from '../components/CallDialpadButton';

const ContactTableRow = ({ _id, name, phones, contactManager, lastChat, channels }: ILivechatContactWithManagerData) => {
	const { getSourceLabel } = useOmnichannelSource();
	const getTimeFromNow = useTimeFromNow(true);
	const directoryRoute = useRoute('omnichannel-directory');
	const isCallReady = useIsCallReady();

	const phoneNumber = phones?.length ? phones[0].phoneNumber : undefined;
	const latestChannel = channels?.reduce((acc, cv) => {
		if (acc.lastChat && cv.lastChat) {
			return acc.lastChat.ts > cv.lastChat.ts ? acc : cv;
		}
		return acc;
	});

	const onRowClick = useEffectEvent(
		(id) => (): void =>
			directoryRoute.push({
				id,
				tab: 'contacts',
				context: 'details',
			}),
	);

	return (
		<GenericTableRow
			action
			key={_id}
			tabIndex={0}
			role='link'
			height='40px'
			qa-user-id={_id}
			rcx-show-call-button-on-hover
			onClick={onRowClick(_id)}
		>
			<GenericTableCell withTruncatedText>{name}</GenericTableCell>
			<GenericTableCell withTruncatedText>
				{latestChannel?.details && (
					<Box withTruncatedText display='flex' alignItems='center'>
						<OmnichannelRoomIcon size='x20' source={latestChannel?.details} />
						<Box withTruncatedText mis={8}>
							{getSourceLabel(latestChannel?.details)}
						</Box>
					</Box>
				)}
			</GenericTableCell>
			<GenericTableCell withTruncatedText>{contactManager?.username}</GenericTableCell>
			<GenericTableCell withTruncatedText>{lastChat && getTimeFromNow(lastChat.ts)}</GenericTableCell>
			{isCallReady && (
				<GenericTableCell>
					<CallDialpadButton phoneNumber={phoneNumber} />
				</GenericTableCell>
			)}
		</GenericTableRow>
	);
};

export default ContactTableRow;
