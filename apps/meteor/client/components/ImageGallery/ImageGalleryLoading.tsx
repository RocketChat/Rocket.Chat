import { css } from '@rocket.chat/css-in-js';
import { IconButton, ModalBackdrop, Throbber } from '@rocket.chat/fuselage';
import React from 'react';
import { createPortal } from 'react-dom';

const closeButtonStyle = css`
	position: absolute;
	z-index: 10;
	top: 10px;
	right: 10px;
`;

const ImageGalleryLoading = ({ onClose }: { onClose: () => void }) =>
	createPortal(
		<ModalBackdrop display='flex' justifyContent='center' color='pure-white'>
			<IconButton icon='cross' aria-label='Close gallery' className={closeButtonStyle} onClick={onClose} />
			<Throbber inheritColor />
		</ModalBackdrop>,
		document.body,
	);

export default ImageGalleryLoading;
