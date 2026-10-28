import {
	Button,
	ButtonGroup,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalHeaderText,
	ModalTitle,
	Text,
} from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import RegisterWorkspaceSetupModal from './RegisterWorkspaceSetupModal';
import RegisterWorkspaceTokenModal from './RegisterWorkspaceTokenModal';
import FeatureBullet from './layout/FeatureBullet';
import RegistrationProse from './layout/RegistrationProse';
import { links } from '../../../../../lib/links';
import useFeatureBullets from '../hooks/useFeatureBullets';

export type RegisterWorkspaceModalProps = {
	onClose: () => void;
	onStatusChange?: () => void;
};

const documentationLink = links.go.registerInfoCollected;

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
				<RegistrationProse>
					{`${t('RegisterWorkspace_NotRegistered_Subtitle')}:`}
					<ul>
						{bulletFeatures.map((features) => (
							<FeatureBullet key={features.key} title={features.title}>
								{features.description}
							</FeatureBullet>
						))}
					</ul>
					<Text is='p'>{t('RegisterWorkspace_Registered_Benefits')}</Text>
				</RegistrationProse>
			</ModalContent>
			<ModalFooter justify='space-between'>
				<ExternalLink to={documentationLink}>{t('Learn_more')}</ExternalLink>
				<ButtonGroup align='end'>
					<Button onClick={handleTokenModal}>{t('Use_token')}</Button>
					<Button variant='primary' onClick={handleSetupModal}>
						{t('RegisterWorkspace_Button')}
					</Button>
				</ButtonGroup>
			</ModalFooter>
		</Modal>
	);
};

export default RegisterWorkspaceModal;
