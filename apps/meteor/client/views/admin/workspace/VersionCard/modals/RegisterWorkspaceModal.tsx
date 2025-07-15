import {
	Box,
	Button,
	ButtonGroup,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalHeaderText,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import RegisterWorkspaceSetupModal from './RegisterWorkspaceSetupModal';
import RegisterWorkspaceTokenModal from './RegisterWorkspaceTokenModal';
import useFeatureBullets from '../hooks/useFeatureBullets';

type RegisterWorkspaceModalProps = {
	onClose: () => void;
	onStatusChange?: () => void;
};

const documentationLink = 'https://go.rocket.chat/i/register-info-collected';

const RegisterWorkspaceModal = ({ onClose, onStatusChange, ...props }: RegisterWorkspaceModalProps) => {
	const setModal = useSetModal();
	const bulletFeatures = useFeatureBullets();
	const { t } = useTranslation();

	const handleTokenModal = (): void => {
		const handleModalClose = (): void => setModal(null);
		setModal(<RegisterWorkspaceTokenModal onClose={handleModalClose} onStatusChange={onStatusChange} />);
	};

	const handleSetupModal = (): void => {
		const handleModalClose = (): void => setModal(null);
		setModal(<RegisterWorkspaceSetupModal onClose={handleModalClose} onStatusChange={onStatusChange} />);
	};

	return (
		<Modal {...props}>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>{t('RegisterWorkspace_NotRegistered_Title')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<Box withRichContent>
					<span>{`${t('RegisterWorkspace_NotRegistered_Subtitle')}:`}</span>
					<ul>
						{bulletFeatures.map((features) => (
							<li key={features.key}>
								<strong>{features.title}</strong>
								<Box is='p' mbs={4}>
									{features.description}
								</Box>
							</li>
						))}
					</ul>
					<Box is='p' fontSize='p2'>
						{t('RegisterWorkspace_Registered_Benefits')}
					</Box>
				</Box>
			</ModalContent>
			<ModalFooter>
				<Box is='div' display='flex' justifyContent='space-between' alignItems='center' w='full'>
					<ExternalLink to={documentationLink}>{t('Learn_more')}</ExternalLink>
					<ButtonGroup align='end'>
						<Button onClick={handleTokenModal}>{t('Use_token')}</Button>
						<Button primary onClick={handleSetupModal}>
							{t('RegisterWorkspace_Button')}
						</Button>
					</ButtonGroup>
				</Box>
			</ModalFooter>
		</Modal>
	);
};

export default RegisterWorkspaceModal;
