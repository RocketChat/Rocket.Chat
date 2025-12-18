import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { ILivechatContactWithManagerData } from '@rocket.chat/rest-typings';
import { GenericTableCell, GenericTableRow } from '@rocket.chat/ui-client';

import ContactItemMenu from './ContactItemMenu';
import { OmnichannelRoomIcon } from '../../../../components/RoomIcon/OmnichannelRoomIcon';
import { useTimeFromNow } from '../../../../hooks/useTimeFromNow';
import { useOmnichannelSource } from '../../hooks/useOmnichannelSource';
import { useOmnichannelDirectoryRouter } from '../hooks/useOmnichannelDirectoryRouter';

const ContactTableRow = ({ _id, name, contactManager, lastChat, channels }: ILivechatContactWithManagerData) => {
	const { getSourceLabel } = useOmnichannelSource();
	const getTimeFromNow = useTimeFromNow(true);
	const omnichannelDirectoryRouter = useOmnichannelDirectoryRouter();

	const latestChannel = channels?.sort((a, b) => {
		if (a.lastChat && b.lastChat) {
			return a.lastChat.ts > b.lastChat.ts ? -1 : 1;
		}

		return 0;
	})[0];

	const onRowClick = useEffectEvent((id: string) =>
		omnichannelDirectoryRouter.navigate({
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
			onClick={() => onRowClick(_id)}
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
			<GenericTableCell>
				<ContactItemMenu _id={_id} name={name} channels={channels} />
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default ContactTableRow;
