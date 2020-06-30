import { Modal as ModalComponent, ModalBackdrop } from '@rocket.chat/fuselage';
import React from 'react';

import ModalPortal from '../ModalPortal';

export function Modal({ ...props }) {
	return <ModalPortal>
		<ModalBackdrop>
			<ModalComponent {...props}/>
		</ModalBackdrop>
	</ModalPortal>;
}

Modal.Header = ModalComponent.Header;
Modal.Footer = ModalComponent.Footer;
Modal.Content = ModalComponent.Content;
Modal.Title = ModalComponent.Title;
Modal.Close = ModalComponent.Close;
