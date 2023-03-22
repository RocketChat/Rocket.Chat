import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Palette } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../components/GenericModal';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';

type OutlookEventItemProps = {
	calendarData: {
		_id: string;
		uid: string;
		startTime: string;
		externalId: string;
		subject: string;
		_updatedAt: string;
		content?: string;
	};
};

const OutlookEventItem = ({ calendarData }: OutlookEventItemProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const formatDateAndTime = useFormatDateAndTime();

	console.log(calendarData);

	const hovered = css`
		&:hover {
			cursor: pointer;
		}

		&:hover,
		&:focus {
			background: ${Palette.surface['surface-hover']};
			.rcx-message {
				background: ${Palette.surface['surface-hover']};
			}
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
				{calendarData.content}
			</GenericModal>,
		);
	};

	return (
		<Box className={hovered} pi='x24' pb='x16' display='flex' justifyContent='space-between' onClick={handleOpenEvent}>
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
