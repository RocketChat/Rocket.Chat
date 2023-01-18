import React from 'react';
import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { cloudConsoleUrl } from '../constants';
// import { useTranslation } from '@rocket.chat/ui-contexts';

type RegisterWorkspaceMenuProps = {
  isWorkspaceRegistered: boolean | string,
  onClick: () => void,
}

const RegisterWorkspaceMenu = ({ isWorkspaceRegistered, onClick }: RegisterWorkspaceMenuProps) => {
  // const t = useTranslation();

  return (
    <ButtonGroup>
      {!isWorkspaceRegistered ? (
        <Button primary onClick={onClick}>
          {'Register Workspace'}
        </Button>
      ) : (
        <>
          <Button is='a' href={cloudConsoleUrl} target='_blank' rel='noopener noreferrer'>
            <Icon name='new-window' size='x20' pie={4} />
            {'Cloud'}
          </Button>
          <Button>
            <Icon name='customize' size='x20' pie={4} />
            {'Manage'}
          </Button>
        </>
      )}
    </ButtonGroup>
  )
}

export default RegisterWorkspaceMenu