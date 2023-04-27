import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Palette } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

type OutlookSettingItemProps = {
	title: string;
	subTitle: string;
	enabled: boolean;
	handleEnable: (value: boolean) => void;
};

const OutlookSettingItem = ({ title, subTitle, enabled, handleEnable }: OutlookSettingItemProps) => {
	const t = useTranslation();

	const hovered = css`
		&:hover,
		&:focus {
			background: ${Palette.surface['surface-hover']};
			.rcx-message {
				background: ${Palette.surface['surface-hover']};
			}
		}
	`;

	return (
		<Box
			borderBlockEndWidth={2}
			borderBlockEndColor='stroke-extra-light'
			borderBlockEndStyle='solid'
			className={hovered}
			pi='x24'
			pb='x16'
			display='flex'
			justifyContent='space-between'
		>
			<Box>
				<Box fontScale='h4'>{title}</Box>
				<Box fontScale='p2'>{subTitle}</Box>
			</Box>
			<Box>
				<Button primary={!enabled} small onClick={() => handleEnable(!enabled)}>
					{enabled ? t('Disable') : t('Enable')}
				</Button>
			</Box>
		</Box>
	);
};

export default OutlookSettingItem;
