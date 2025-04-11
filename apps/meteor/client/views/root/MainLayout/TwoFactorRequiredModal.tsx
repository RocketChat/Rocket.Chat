import { Button, Modal } from '@rocket.chat/fuselage';
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
			<Modal.Header>
				<Modal.Title>{t('Two-factor_authentication_required')}</Modal.Title>
			</Modal.Header>
			<Modal.Content>{t('Two-factor_authentication_required_modal')}</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button primary onClick={closeModal}>
						{t('Set_up_2FA')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default TwoFactorRequiredModal;
