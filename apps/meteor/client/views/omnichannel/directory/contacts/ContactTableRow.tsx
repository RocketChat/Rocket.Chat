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
		<GenericTableRow action key={_id} tabIndex={0} height='40px' rcx-show-call-button-on-hover onClick={() => onRowClick(_id)}>
			<GenericTableCell withTruncatedText verticalAlign='top'>
				<Box withTruncatedText fontScale='p2m' color='default'>
					{name}
				</Box>
			</GenericTableCell>
			<GenericTableCell withTruncatedText verticalAlign='top'>
				{latestChannel?.details && (
					<Box withTruncatedText display='flex' alignItems='center'>
						<OmnichannelRoomIcon size='x20' source={latestChannel?.details} />
						<Box withTruncatedText mis={8}>
							{getSourceLabel(latestChannel?.details)}
						</Box>
					</Box>
				)}
			</GenericTableCell>
			<GenericTableCell withTruncatedText verticalAlign='top'>
				{contactManager?.username}
			</GenericTableCell>
			<GenericTableCell withTruncatedText verticalAlign='top'>
				{lastChat && (
					<Box display='flex' flexDirection='column'>
						<Box fontScale='p2m' withTruncatedText color='default' title={formatDate(lastChat.ts)}>
							{formatDate(lastChat.ts)}
						</Box>
						<Box color='hint' withTruncatedText>
							{getTimeFromNow(lastChat.ts)}
						</Box>
					</Box>
				)}
			</GenericTableCell>
			<GenericTableCell verticalAlign='top'>
				<ContactItemMenu _id={_id} name={name} channels={channels} />
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default ContactTableRow;
