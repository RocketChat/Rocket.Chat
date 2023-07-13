import type { ReactNode } from 'react';
import React from 'react';

import { useAuditing } from './hooks/useAuditing';
import { useCannedResponses } from './hooks/useCannedResponses';
import { useDeviceManagement } from './hooks/useDeviceManagement';
import { useFederationSlashCommand } from './hooks/useFederationSlashCommand';
import { useGameCenter } from './hooks/useGameCenter';
import { useGuestPermissions } from './hooks/useGuestPermissions';
import { useLivechatEnterprise } from './hooks/useLivechatEnterprise';
import { useReadReceipts } from './hooks/useReadReceipts';

type EnterpriseProviderProps = {
	children: ReactNode;
};

const EnterpriseProvider = ({ children }: EnterpriseProviderProps) => {
	useAuditing();
	useCannedResponses();
	useDeviceManagement();
	useFederationSlashCommand();
	useGameCenter();
	useGuestPermissions();
	useLivechatEnterprise();
	useReadReceipts();

	return <>{children}</>;
};

export default EnterpriseProvider;
