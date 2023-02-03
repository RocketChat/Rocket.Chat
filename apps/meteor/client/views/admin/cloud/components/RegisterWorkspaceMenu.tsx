import React from 'react';
import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { cloudConsoleUrl } from '../constants';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import RegisteredWorkspaceModal from '../modals/RegisteredWorkspaceModal';

type RegisterWorkspaceMenuProps = {
  isWorkspaceRegistered: boolean | string,
  onClick: () => void,
}

const RegisterWorkspaceMenu = ({ isWorkspaceRegistered, onClick }: RegisterWorkspaceMenuProps) => {
  const t = useTranslation();
  const setModal = useSetModal();

  const handleManageButton = () => {
    const handleModalClose = (): void => setModal(null);
		setModal(<RegisteredWorkspaceModal onClose={handleModalClose} />);
  }

  return (
    <ButtonGroup>
      {!isWorkspaceRegistered ? (
        <Button primary onClick={onClick}>
          {t('RegisterWorkspace_Button')}
        </Button>
      ) : (
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
    </ButtonGroup>
  )
}

export default RegisterWorkspaceMenu