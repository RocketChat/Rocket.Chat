import { ModalBackdrop, Throbber } from '@rocket.chat/fuselage';
import React from 'react';
import { createPortal } from 'react-dom';

const ImageGalleryLoader = () =>
	createPortal(
		<ModalBackdrop display='flex' justifyContent='center'>
			<Throbber />
		</ModalBackdrop>,
		document.body,
	);

export default ImageGalleryLoader;
