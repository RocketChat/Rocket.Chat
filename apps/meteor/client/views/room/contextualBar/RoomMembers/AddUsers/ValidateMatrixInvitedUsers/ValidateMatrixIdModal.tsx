import { Modal, Button, Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

type ValidateMatrixIdModalProps = {
	_matrixIdVerifiedStatus: Map<string, string>;
	onClose: () => void;
	onConfirm?: () => void;
};

const ValidateMatrixIdModal = ({ onClose, onConfirm, _matrixIdVerifiedStatus }: ValidateMatrixIdModalProps): ReactElement => {
	const t = useTranslation();

	const verificationStatusAsIcon = (verificationStatus: string) => {
		if (verificationStatus === 'VERIFIED') {
			return <Icon name='circle-check' size='x20' />;
		}

		if (verificationStatus === 'UNVERIFIED') {
			return <Icon name='circle-cross' size='x20' />;
		}

		if (verificationStatus === 'UNABLE_TO_VERIFY') {
			return <Icon name='circle-exclamation' size='x20' />;
		}
	};

	const matrixIdsAfterValidationList = () =>
		Array.from(_matrixIdVerifiedStatus.entries()).map(([_matrixId, _verificationStatus]) => (
			<li key={_matrixId}>
				{_matrixId}: {verificationStatusAsIcon(_verificationStatus)}
			</li>
		));

	return (
		<Modal>
			<Modal.Header>
				<Modal.HeaderText>
					<Modal.Title>Sending Invitations</Modal.Title>
				</Modal.HeaderText>
				<Modal.Close title={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box>
					<Box is='ul'>{matrixIdsAfterValidationList()}</Box>
				</Box>
			</Modal.Content>
			<Modal.Footer justifyContent='center'>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					{onConfirm && (
						<Button primary onClick={onConfirm}>
							{t('Yes_continue')}
						</Button>
					)}
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default ValidateMatrixIdModal;
