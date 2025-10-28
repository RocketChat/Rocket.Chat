import { Button, Modal, ModalContent, ModalFooter, ModalFooterControllers, ModalHeader, ModalTitle } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const TwoFactorRequiredModal = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	const closeModal = useCallback(() => {
		setModal(null);
	}, [setModal]);

	return (
		<Modal>
			<ModalHeader>
				<ModalTitle>{t('Two-factor_authentication_required')}</ModalTitle>
			</ModalHeader>
			<ModalContent>{t('Enable_two-factor_authentication_callout_description')}</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button primary onClick={closeModal}>
						{t('Set_up_2FA')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default TwoFactorRequiredModal;
