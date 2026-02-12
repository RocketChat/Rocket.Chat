import {
	Button,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalIcon,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type AppUpdateModalProps = {
	confirm: () => void;
	cancel: () => void;
};

const AppUpdateModal = ({ confirm, cancel, ...props }: AppUpdateModalProps) => {
	const { t } = useTranslation();

	const handleCloseButtonClick = (): void => {
		cancel();
	};

	const handleCancelButtonClick = (): void => {
		cancel();
	};

	const handleConfirmButtonClick = (): void => {
		confirm();
	};

	return (
		<Modal {...props}>
			<ModalHeader>
				<ModalIcon color='status-font-on-danger' name='info-circled' />
				<ModalTitle>{t('Apps_Manual_Update_Modal_Title')}</ModalTitle>
				<ModalClose onClick={handleCloseButtonClick} />
			</ModalHeader>
			<ModalContent fontScale='p2'>{t('Apps_Manual_Update_Modal_Body')}</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button secondary onClick={handleCancelButtonClick}>
						{t('No')}
					</Button>
					<Button danger onClick={handleConfirmButtonClick}>
						{t('Yes')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default AppUpdateModal;
