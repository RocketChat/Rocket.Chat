import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useExternalLink } from '../../../../hooks/useExternalLink';
import { CLOUD_CONSOLE_URL } from '../../../../lib/constants';
import RegisteredWorkspaceModal from '../modals/RegisteredWorkspaceModal';

type RegisterWorkspaceMenuProps = {
	isWorkspaceRegistered: boolean | string;
	isConnectedToCloud: boolean | string;
	onClick: () => void;
	onClickOfflineRegistration: () => void;
	onStatusChange?: () => void;
};

const RegisterWorkspaceMenu = ({
	isWorkspaceRegistered,
	isConnectedToCloud,
	onClick,
	onClickOfflineRegistration,
	onStatusChange,
}: RegisterWorkspaceMenuProps) => {
	const t = useTranslation();
	const setModal = useSetModal();

	const handleManageButton = () => {
		const handleModalClose = (): void => setModal(null);
		setModal(<RegisteredWorkspaceModal onClose={handleModalClose} onStatusChange={onStatusChange} />);
	};

	const handleLinkClick = useExternalLink();

	return (
		<ButtonGroup>
			{isWorkspaceRegistered && isConnectedToCloud && (
				<>
					<Button icon='new-window' role='link' onClick={() => handleLinkClick(CLOUD_CONSOLE_URL)}>
						{t('Cloud')}
					</Button>
					<Button icon='customize' onClick={handleManageButton}>
						{t('Manage')}
					</Button>
				</>
			)}

			{isWorkspaceRegistered && !isConnectedToCloud && (
				<Button primary onClick={onClick}>
					{t('ConnectWorkspace_Button')}
				</Button>
			)}
			{!isWorkspaceRegistered && (
				<>
					<Button onClick={onClickOfflineRegistration}>{t('Cloud_Register_manually')}</Button>
					<Button primary onClick={onClick}>
						{t('RegisterWorkspace_Button')}
					</Button>
				</>
			)}
		</ButtonGroup>
	);
};

export default RegisterWorkspaceMenu;
