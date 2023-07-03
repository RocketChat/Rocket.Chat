import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { cloudConsoleUrl } from '../constants';
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

	return (
		<ButtonGroup>
			{isWorkspaceRegistered && isConnectedToCloud && (
				<>
					<Button is='a' href={cloudConsoleUrl} target='_blank' rel='noopener noreferrer'>
						<Icon name='new-window' size='x20' pie={4} />
						{t('Cloud')}
					</Button>
					<Button onClick={handleManageButton}>
						<Icon name='customize' size='x20' pie={4} />
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
