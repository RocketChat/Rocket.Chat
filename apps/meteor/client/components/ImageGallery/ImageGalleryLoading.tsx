import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton, ModalBackdrop, Throbber, useStyle } from '@rocket.chat/fuselage';
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
	const closeButtonClassName = useStyle(closeButtonStyle);

	return createPortal(
		<ModalBackdrop>
			<Box display='flex' flexDirection='column' flexGrow={1} justifyContent='center' color='pure-white'>
				<IconButton icon='cross' aria-label={t('Close_gallery')} className={closeButtonClassName} onClick={onClose} />
				<Throbber inheritColor />
			</Box>
		</ModalBackdrop>,
		document.body,
	);
};
