import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Palette } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../components/GenericModal';

type OutlookEventItemProps = {};

const OutlookEventItem = ({ calendarData }: OutlookEventItemProps) => {
	const t = useTranslation();
	const setModal = useSetModal();

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
			<GenericModal tagline={t('Outlook calendar event')} icon={null} title={calendarData.title} onCancel={() => setModal(null)}>
				{calendarData.content}
			</GenericModal>,
		);
	};

	return (
		<Box className={hovered} pi='x24' pb='x16' display='flex' justifyContent='space-between' onClick={handleOpenEvent}>
			<Box>
				<Box fontScale='h4'>{calendarData.title}</Box>
				<Box fontScale='c1'>{calendarData.subTitle}</Box>
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
