import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { ILivechatContactWithManagerData } from '@rocket.chat/rest-typings';
import { GenericTableCell, GenericTableRow } from '@rocket.chat/ui-client';

import ContactItemMenu from './ContactItemMenu';
import { OmnichannelRoomIcon } from '../../../../components/RoomIcon/OmnichannelRoomIcon';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { useTimeFromNow } from '../../../../hooks/useTimeFromNow';
import { useOmnichannelSource } from '../../hooks/useOmnichannelSource';
import { useOmnichannelDirectoryRouter } from '../hooks/useOmnichannelDirectoryRouter';

/**
 * TODO: We should have a variant for aligning row cell instead of using custom CSS
 **/
const customAlignTop = css`
	td {
		vertical-align: top;
	}
`;

const ContactTableRow = ({ _id, name, contactManager, lastChat, channels }: ILivechatContactWithManagerData) => {
	const { getSourceLabel } = useOmnichannelSource();
	const getTimeFromNow = useTimeFromNow(true);
	const formatDate = useFormatDate();
	const omnichannelDirectoryRouter = useOmnichannelDirectoryRouter();

	const latestChannel = channels?.sort((a, b) => {
		if (a.lastChat && b.lastChat) {
			return a.lastChat.ts > b.lastChat.ts ? -1 : 1;
		}

		return 0;
	})[0];

	const onRowClick = useStableCallback((id: string) =>
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
			height='40px'
			rcx-show-call-button-on-hover
			className={customAlignTop}
			onClick={() => onRowClick(_id)}
		>
			<GenericTableCell fontScale='p2m' color='default' withTruncatedText>
				{name}
			</GenericTableCell>
			<GenericTableCell withTruncatedText>
				{latestChannel?.details && (
					<Box withTruncatedText display='flex' alignItems='center'>
						<OmnichannelRoomIcon size='x20' source={latestChannel?.details} />
						<Box withTruncatedText marginInlineStart={8}>
							{getSourceLabel(latestChannel?.details)}
						</Box>
					</Box>
				)}
			</GenericTableCell>
			<GenericTableCell withTruncatedText>{contactManager?.username}</GenericTableCell>
			<GenericTableCell withTruncatedText>
				{lastChat && (
					<Box display='flex' flexDirection='column'>
						<Box fontScale='p2m' withTruncatedText color='default'>
							{formatDate(lastChat.ts)}
						</Box>
						<Box withTruncatedText>{getTimeFromNow(lastChat.ts)}</Box>
					</Box>
				)}
			</GenericTableCell>
			<GenericTableCell>
				<ContactItemMenu _id={_id} name={name} channels={channels} />
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default ContactTableRow;
