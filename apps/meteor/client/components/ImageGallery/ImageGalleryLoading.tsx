import { css } from '@rocket.chat/css-in-js';
import { IconButton, ModalBackdrop, Throbber } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import { createPortal } from 'react-dom';

const closeButtonStyle = css`
	position: absolute;
	z-index: 10;
	top: 10px;
	right: 10px;
`;

export const ImageGalleryLoading = ({ onClose }: { onClose: () => void }) => {
	const t = useTranslation();

	return createPortal(
		<ModalBackdrop display='flex' justifyContent='center' color='pure-white'>
			<IconButton icon='cross' aria-label={t('Close_gallery')} className={closeButtonStyle} onClick={onClose} />
			<Throbber inheritColor />
		</ModalBackdrop>,
		document.body,
	);
};
