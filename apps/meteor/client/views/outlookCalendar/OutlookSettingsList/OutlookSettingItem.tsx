import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Palette, Text } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type OutlookSettingItemProps = {
	title: string;
	subTitle: string;
	enabled: boolean;
	handleEnable: (value: boolean) => void;
};

const OutlookSettingItem = ({ title, subTitle, enabled, handleEnable }: OutlookSettingItemProps) => {
	const { t } = useTranslation();

	const hovered = css`
		&:hover {
			background: ${Palette.surface['surface-hover']};
		}
	`;

	return (
		<Box
			borderBlockEndWidth='default'
			borderBlockEndColor='stroke-extra-light'
			borderBlockEndStyle='solid'
			className={hovered}
			paddingInline={24}
			paddingBlock={16}
			display='flex'
			justifyContent='space-between'
		>
			<Box marginInlineEnd={8}>
				<Text fontScale='h4'>{title}</Text>
				<Text fontScale='p2'>{subTitle}</Text>
			</Box>
			<Box>
				<Button variant={!enabled ? 'primary' : undefined} size='small' onClick={() => handleEnable(!enabled)}>
					{enabled ? t('Disable') : t('Enable')}
				</Button>
			</Box>
		</Box>
	);
};

export default OutlookSettingItem;
