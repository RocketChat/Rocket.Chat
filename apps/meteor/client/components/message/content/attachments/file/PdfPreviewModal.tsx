import {
	Button,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalTitle,
} from '@rocket.chat/fuselage';
import type { CSSProperties, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type PdfPreviewModalProps = {
	title?: string;
	url: string;
	onClose: () => void;
	downloadUrl?: string;
	onOpenInApp?: () => void;
};

const iframeStyle: CSSProperties = { width: '100%', height: '70vh', border: 'none' };

const PdfPreviewModal = ({ title, url, onClose, downloadUrl, onOpenInApp }: PdfPreviewModalProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<Modal open>
			<ModalHeader>
				<ModalTitle>{title || 'PDF'}</ModalTitle>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<iframe src={url} style={iframeStyle} title={title || 'PDF preview'} />
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					{downloadUrl && (
						<Button is='a' href={downloadUrl} download secondary>
							{t('Download')}
						</Button>
					)}
					{onOpenInApp && (
						<Button secondary onClick={onOpenInApp}>
							{t('Open')}
						</Button>
					)}
					<Button primary onClick={onClose}>
						{t('Close')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default PdfPreviewModal;
