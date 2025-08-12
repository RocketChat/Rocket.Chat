import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Palette } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import ImageBox from './ImageBox';

type RetryProps = { retry: () => void };

const Retry = ({ retry }: RetryProps) => {
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
		<ImageBox className={clickable} onClick={retry} size='x160'>
			<Icon name='refresh' color='hint' size='x64' />
			<Box fontScale='h3' color='default' textAlign='center'>
				{t('Retry')}
			</Box>
		</ImageBox>
	);
};

export default Retry;
