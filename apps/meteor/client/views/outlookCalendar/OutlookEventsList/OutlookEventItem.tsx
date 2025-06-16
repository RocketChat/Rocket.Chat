import type { ICalendarEvent, Serialized } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Palette } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import OutlookCalendarEventModal from '../OutlookCalendarEventModal';
import { useOutlookOpenCall } from '../hooks/useOutlookOpenCall';

type OutlookEventItemProps = Serialized<ICalendarEvent>;

const OutlookEventItem = ({ subject, description, startTime, meetingUrl }: OutlookEventItemProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const formatDateAndTime = useFormatDateAndTime();
	const openCall = useOutlookOpenCall(meetingUrl);

	const hovered = css`
		&:hover {
			cursor: pointer;
		}

		&:hover,
		&:focus {
			background: ${Palette.surface['surface-hover']};
		}
	`;

	const handleOpenEvent = () => {
		setModal(
			<OutlookCalendarEventModal
				onClose={() => setModal(null)}
				onCancel={() => setModal(null)}
				subject={subject}
				meetingUrl={meetingUrl}
				description={description}
			/>,
		);
	};

	return (
		<Box
			className={hovered}
			borderBlockEndWidth={1}
			borderBlockEndColor='stroke-extra-light'
			borderBlockEndStyle='solid'
			pi={24}
			pb={16}
			display='flex'
			justifyContent='space-between'
			onClick={handleOpenEvent}
		>
			<Box>
				<Box fontScale='h4'>{subject}</Box>
				<Box fontScale='c1'>{formatDateAndTime(startTime)}</Box>
			</Box>
			<Box>
				{meetingUrl && (
					<Button onClick={openCall} small>
						{t('Join')}
					</Button>
				)}
			</Box>
		</Box>
	);
};

export default OutlookEventItem;
