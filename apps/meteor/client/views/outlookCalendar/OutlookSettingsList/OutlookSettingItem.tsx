import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Palette } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

type OutlookSettingItemProps = {
	id: string;
	title: string;
	subTitle: string;
	enabled: boolean;
	handleEnable: (value: boolean) => void;
};

const OutlookSettingItem = ({ id, title, subTitle, enabled, handleEnable }: OutlookSettingItemProps) => {
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
			borderBlockEndWidth={1}
			borderBlockEndColor='stroke-extra-light'
			borderBlockEndStyle='solid'
			className={hovered}
			pi={24}
			pb={16}
			display='flex'
			justifyContent='space-between'
		>
			<Box mie={8}>
				<Box fontScale='h4'>{title}</Box>
				<Box fontScale='p2'>{subTitle}</Box>
			</Box>
			<Box>
				{id === 'authentication' && (
					<Button small onClick={() => handleEnable(!enabled)}>
						{t('Disable')}
					</Button>
				)}
				{id !== 'authentication' && (
					<Button primary={!enabled} small onClick={() => handleEnable(!enabled)}>
						{enabled ? t('Disable') : t('Enable')}
					</Button>
				)}
			</Box>
		</Box>
	);
};

export default OutlookSettingItem;
