import type { ReactNode } from 'react';
import React from 'react';

import { useAuditing } from './hooks/useAuditing';
import { useCallsRoomAction } from './hooks/useCallsRoomAction';
import { useCannedResponses } from './hooks/useCannedResponses';
import { useCannedResponsesRoomAction } from './hooks/useCannedResponsesRoomAction';
import { useDeviceManagement } from './hooks/useDeviceManagement';
import { useFederationSlashCommand } from './hooks/useFederationSlashCommand';
import { useGameCenterRoomAction } from './hooks/useGameCenterRoomAction';
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
	useGuestPermissions();
	useLivechatEnterprise();
	useReadReceipts();

	useCallsRoomAction();
	useCannedResponsesRoomAction();
	useGameCenterRoomAction();

	return <>{children}</>;
};

export default EnterpriseProvider;
