import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Palette } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC, ComponentProps } from 'react';
import React from 'react';

import ImageBox from './ImageBox';

type RetryProps = ComponentProps<typeof Box> & { retry: () => void };

const Retry: FC<RetryProps> = ({ retry }) => {
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
		<ImageBox className={clickable} onClick={retry} size={160}>
			<Icon name='refresh' color='hint' size='x64' />
			<Box fontScale='h2' color='default'>
				{t('Retry')}
			</Box>
		</ImageBox>
	);
};

export default Retry;
