import { css } from '@rocket.chat/css-in-js';
import { IconButton, ModalBackdrop } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import { createPortal } from 'react-dom';

import GenericError from '../GenericError/GenericError';

const closeButtonStyle = css`
	position: absolute;
	z-index: 10;
	top: 10px;
	right: 10px;
`;

export const ImageGalleryError = ({ onClose }: { onClose: () => void }) => {
	const t = useTranslation();

	return createPortal(
		<ModalBackdrop display='flex' justifyContent='center' color='pure-white'>
			<GenericError buttonAction={onClose} buttonTitle={t('Close')} />
			<IconButton icon='cross' aria-label={t('Close_gallery')} className={closeButtonStyle} onClick={onClose} />
		</ModalBackdrop>,
		document.body,
	);
};
