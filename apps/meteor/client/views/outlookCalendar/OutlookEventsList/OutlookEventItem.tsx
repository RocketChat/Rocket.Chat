import type { ICalendarEvent } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Palette } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../components/GenericModal';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import { useVideoConfOpenCall } from '../../room/contextualBar/VideoConference/hooks/useVideoConfOpenCall';
import OutlookEventItemContent from './OutlookEventItemContent';

type OutlookEventItemProps = Omit<Partial<ICalendarEvent>, 'startTime' | '_updatedAt'> & { startTime: string };

const OutlookEventItem = ({ subject, description, startTime, meetingUrl }: OutlookEventItemProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const formatDateAndTime = useFormatDateAndTime();
	const handleOpenCall = useVideoConfOpenCall();

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
				title={subject}
				confirmText={t('Close')}
				onClose={() => setModal(null)}
				onConfirm={() => setModal(null)}
			>
				{description && <OutlookEventItemContent html={description} />}
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
					<Button onClick={() => handleOpenCall(meetingUrl)} small>
						{t('Join')}
					</Button>
				)}
			</Box>
		</Box>
	);
};

export default OutlookEventItem;
