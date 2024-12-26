import { css } from '@rocket.chat/css-in-js';
import { IconButton, ModalBackdrop, Throbber } from '@rocket.chat/fuselage';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

const closeButtonStyle = css`
	position: absolute;
	z-index: 10;
	top: 10px;
	right: 10px;
`;

export const ImageGalleryLoading = ({ onClose }: { onClose: () => void }) => {
	const { t } = useTranslation();

	return createPortal(
		<ModalBackdrop display='flex' justifyContent='center' color='pure-white'>
			<IconButton icon='cross' aria-label={t('Close_gallery')} className={closeButtonStyle} onClick={onClose} />
			<Throbber inheritColor />
		</ModalBackdrop>,
		document.body,
	);
};
