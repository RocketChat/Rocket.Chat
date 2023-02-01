import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Palette } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

const OutlookSettingItem = ({ settingData }) => {
	const t = useTranslation();

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

	return (
		<Box className={hovered} pi='x24' pb='x16' display='flex' justifyContent='space-between'>
			<Box>
				<Box fontScale='h4'>{settingData.title}</Box>
				<Box fontScale='p2'>{settingData.subTitle}</Box>
			</Box>
			<Box>
				<Button small onClick={() => window.open(settingData.href)}>
					{t('Stop')}
				</Button>
			</Box>
		</Box>
	);
};

export default OutlookSettingItem;
