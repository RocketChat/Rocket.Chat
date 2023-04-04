import type { ICalendarEvent } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Palette } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../components/GenericModal';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import OutlookEventItemContent from './OutlookEventItemContent';

type OutlookEventItemProps = {
	calendarData: ICalendarEvent;
};

const OutlookEventItem = ({ calendarData }: OutlookEventItemProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const formatDateAndTime = useFormatDateAndTime();

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
				title={calendarData.subject}
				confirmText={t('Close')}
				onClose={() => setModal(null)}
				onConfirm={() => setModal(null)}
			>
				<OutlookEventItemContent html={calendarData.description} />
			</GenericModal>,
		);
	};

	return (
		<Box
			className={hovered}
			borderBlockEndWidth={2}
			borderBlockEndColor='stroke-extra-light'
			borderBlockEndStyle='solid'
			pi='x24'
			pb='x16'
			display='flex'
			justifyContent='space-between'
			onClick={handleOpenEvent}
		>
			<Box>
				<Box fontScale='h4'>{calendarData.subject}</Box>
				<Box fontScale='c1'>{formatDateAndTime(calendarData.startTime)}</Box>
			</Box>
			<Box>
				<Button onClick={() => console.log('join')} small>
					{t('Join')}
				</Button>
			</Box>
		</Box>
	);
};

export default OutlookEventItem;
