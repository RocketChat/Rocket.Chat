import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Palette } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';

import ImageBox from './ImageBox';

type LoadProps = ComponentPropsWithoutRef<typeof Box> & { load: () => void };

const Load = ({ load, ...props }: LoadProps) => {
	const { t } = useTranslation();
	const clickable = css`
		cursor: pointer;
		background: ${Palette.surface['surface-tint']};

		&:hover,
		&:focus {
			background: ${Palette.surface['surface-hover']};
		}
	`;
	return (
		<ImageBox className={clickable} {...props} onClick={load}>
			<Icon name='image' color='hint' size='x64' />
			<Box fontScale='h2' color='default'>
				{t('Click_to_load')}
			</Box>
		</ImageBox>
	);
};

export default Load;
