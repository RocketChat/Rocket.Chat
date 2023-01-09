import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Palette } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, FC } from 'react';
import React from 'react';

import ImageBox from './ImageBox';

type LoadProps = ComponentProps<typeof Box> & { load: () => void };

const Load: FC<LoadProps> = ({ load, ...props }) => {
	const t = useTranslation();
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
