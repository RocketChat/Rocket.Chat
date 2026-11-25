import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Palette } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';

import ImageBox from './ImageBox';

export type LoadProps = ComponentPropsWithoutRef<typeof Box> & { load: () => void };

const clickable = css`
	cursor: pointer;
	background: ${Palette.surface['surface-tint']};

	&:hover,
	&:focus {
		background: ${Palette.surface['surface-hover']};
	}
`;

const Load = ({ load, ...props }: LoadProps) => {
	const { t } = useTranslation();
	return (
		<ImageBox className={clickable} color='hint' {...props} onClick={load}>
			<Icon name='image' size='x64' />
			<Box fontScale='h2' color='default'>
				{t('Click_to_load')}
			</Box>
		</ImageBox>
	);
};

export default Load;
