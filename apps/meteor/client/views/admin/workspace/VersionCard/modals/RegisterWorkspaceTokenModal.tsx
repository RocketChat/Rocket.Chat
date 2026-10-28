import {
	Button,
	ButtonGroup,
	Field,
	FieldLabel,
	FieldRow,
	FieldError,
	Modal,
	TextInput,
	ModalHeader,
	ModalHeaderText,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	Stack,
	Text,
} from '@rocket.chat/fuselage';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import WorkspaceRegistrationModal from './RegisterWorkspaceModal';

export type RegisterWorkspaceTokenModalProps = {
	onClose: () => void;
	onStatusChange?: () => void;
};

const RegisterWorkspaceTokenModal = ({ onClose, onStatusChange, ...props }: RegisterWorkspaceTokenModalProps) => {
	const setModal = useSetModal();
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const connectWorkspace = useEndpoint('POST', '/v1/cloud.connectWorkspace');

	const [token, setToken] = useState('');
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState(false);

	const handleBackAction = (): void => {
		const handleModalClose = (): void => setModal(null);
		setModal(<WorkspaceRegistrationModal onClose={handleModalClose} />);
	};

	const handleTokenChange = (event: ChangeEvent<HTMLInputElement>) => {
		setToken(event.target.value);
	};

	const isToken = token.length > 0;

	const handleConnectButtonClick = async (): Promise<void> => {
		setProcessing(true);
		setError(false);

		try {
			await connectWorkspace({ token });

			setModal(null);

			dispatchToastMessage({ type: 'success', message: t('Connected') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			setError(true);
		} finally {
			await onStatusChange?.();
			setProcessing(false);
		}
	};

	return (
		<Modal {...props}>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>{t('RegisterWorkspace_Token_Title')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<Text is='p'>
					<Trans i18nKey='RegisterWorkspace_Token_Step_One'>
						1. Go to:{' '}
						<Text is='strong' fontScale='p2b'>
							cloud.rocket.chat {'>'} Workspaces
						</Text>{' '}
						and click{' '}
						<Text is='strong' fontScale='p2b'>
							"Register self-managed"
						</Text>
						.
					</Trans>
				</Text>
				<Stack gap='x8'>
					<Text is='p'>{`2. ${t('RegisterWorkspace_Token_Step_Two')}`}</Text>
					<Field>
						<FieldLabel>{t('Registration_Token')}</FieldLabel>
						<FieldRow>
							<TextInput onChange={handleTokenChange} value={token} />
						</FieldRow>
						{error && <FieldError>{t('Token_Not_Recognized')}</FieldError>}
					</Field>
				</Stack>
			</ModalContent>
			<ModalFooter>
				<ButtonGroup align='end'>
					<Button onClick={handleBackAction}>{t('Back')}</Button>
					<Button variant='primary' disabled={!isToken} loading={processing} onClick={handleConnectButtonClick}>
						{t('Next')}
					</Button>
				</ButtonGroup>
			</ModalFooter>
		</Modal>
	);
};

export default RegisterWorkspaceTokenModal;
