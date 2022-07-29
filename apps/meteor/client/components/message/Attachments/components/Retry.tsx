import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, ComponentProps } from 'react';

import ImageBox from './ImageBox';

type RetryProps = ComponentProps<typeof Box> & { retry: () => void };

const Retry: FC<RetryProps> = ({ retry }) => {
	const t = useTranslation();
	const clickable = css`
		cursor: pointer;
		background: var(--rxc-color-neutral-100, ${colors.n100}) !important;

		&:hover,
		&:focus {
			background: var(--rxc-color-neutral-300, ${colors.n300}) !important;
		}
	`;
	return (
		<ImageBox className={clickable} onClick={retry} size={160}>
			<Icon name='refresh' color='neutral-700' size='x64' />
			<Box fontScale='h2' color='default'>
				{t('Retry')}
			</Box>
		</ImageBox>
	);
};

export default Retry;
