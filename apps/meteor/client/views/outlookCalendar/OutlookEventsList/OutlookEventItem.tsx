import type { ICalendarEvent, Serialized } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Palette } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation, useUser } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../components/GenericModal';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import { useUserDisplayName } from '../../../hooks/useUserDisplayName';
import { useVideoConfOpenCall } from '../../room/contextualBar/VideoConference/hooks/useVideoConfOpenCall';
import OutlookEventItemContent from './OutlookEventItemContent';

const OutlookEventItem = ({ subject, description, startTime, meetingUrl }: Serialized<ICalendarEvent>) => {
	const t = useTranslation();
	const user = useUser();
	const setModal = useSetModal();
	const formatDateAndTime = useFormatDateAndTime();
	const handleOpenCall = useVideoConfOpenCall();
	const userDisplayName = useUserDisplayName({ name: user?.name, username: user?.username });

	const namedMeetingUrl = `${meetingUrl}&name=${userDisplayName}`;

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
			<GenericModal
				tagline={t('Outlook_calendar_event')}
				icon={null}
				variant='warning'
				title={subject}
				cancelText={t('Close')}
				confirmText={t('Join_call')}
				onClose={() => setModal(null)}
				onCancel={() => setModal(null)}
				onConfirm={meetingUrl ? () => handleOpenCall(namedMeetingUrl) : undefined}
			>
				{description ? <OutlookEventItemContent html={description} /> : t('No_content_was_provided')}
			</GenericModal>,
		);
	};

	return (
		<Box
			className={hovered}
			borderBlockEndWidth={1}
			borderBlockEndColor='stroke-extra-light'
			borderBlockEndStyle='solid'
			pi='x24'
			pb='x16'
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
					<Button onClick={() => handleOpenCall(namedMeetingUrl)} small>
						{t('Join')}
					</Button>
				)}
			</Box>
		</Box>
	);
};

export default OutlookEventItem;
