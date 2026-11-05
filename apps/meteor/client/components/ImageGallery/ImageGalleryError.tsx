import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton, ModalBackdrop, useStyle } from '@rocket.chat/fuselage';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import GenericError from '../GenericError/GenericError';

const closeButtonStyle = css`
	position: absolute;
	z-index: 10;
	top: 10px;
	right: 10px;
`;

export const ImageGalleryError = ({ onClose }: { onClose: () => void }) => {
	const { t } = useTranslation();
	const closeButtonClassName = useStyle(closeButtonStyle);

	return createPortal(
		<ModalBackdrop>
			<Box display='flex' flexDirection='column' flexGrow={1} justifyContent='center' color='pure-white'>
				<GenericError buttonAction={onClose} buttonTitle={t('Close')} />
				<IconButton icon='cross' aria-label={t('Close_gallery')} className={closeButtonClassName} onClick={onClose} />
			</Box>
		</ModalBackdrop>,
		document.body,
	);
};
