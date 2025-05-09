import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Palette } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { Upload } from '../../../../lib/chats/Upload';

type UploadProgressIndicatorProps = {
	id: Upload['id'];
	name: string;
	percentage: number;
	error?: string;
	onClose?: (id: Upload['id']) => void;
};

const UploadProgressIndicator = ({ id, name, percentage, error, onClose }: UploadProgressIndicatorProps): ReactElement | null => {
	const { t } = useTranslation();

	const customClass = css`
		&::after {
			content: '';
			position: absolute;
			z-index: 1;
			left: 0;
			width: ${percentage}%;
			height: 100%;
			transition: width, 1s, ease-out;
			background-color: ${Palette.surface['surface-neutral']};
		}
	`;

	const handleCloseClick = useCallback(() => {
		onClose?.(id);
	}, [id, onClose]);

	return (
		<Box
			pb={4}
			pi={8}
			mbe={4}
			borderRadius={4}
			borderWidth={1}
			border='1px solid'
			color={error ? 'danger' : 'info'}
			overflow='hidden'
			position='relative'
			display='flex'
			elevation='1'
			alignItems='center'
			justifyContent='space-between'
			bg='surface-tint'
			className={customClass}
		>
			<Box withTruncatedText zIndex={2} borderRadius={4}>
				[{percentage}%] {name}
			</Box>
			<Button zIndex={3} small onClick={handleCloseClick}>
				{t('Cancel')}
			</Button>
		</Box>
	);
};

export default UploadProgressIndicator;
