import type { ReactNode } from 'react';
import React from 'react';

import { useAuditing } from './hooks/useAuditing';
import { useDeviceManagement } from './hooks/useDeviceManagement';
import { useFederationSlashCommand } from './hooks/useFederationSlashCommand';
import { useGameCenter } from './hooks/useGameCenter';
import { useGuestPermissions } from './hooks/useGuestPermissions';
import { useReadReceipts } from './hooks/useReadReceipts';

type EnterpriseProviderProps = {
	children: ReactNode;
};

const EnterpriseProvider = ({ children }: EnterpriseProviderProps) => {
	useAuditing();
	useDeviceManagement();
	useFederationSlashCommand();
	useGameCenter();
	useGuestPermissions();
	useReadReceipts();

	return <>{children}</>;
};

export default EnterpriseProvider;
