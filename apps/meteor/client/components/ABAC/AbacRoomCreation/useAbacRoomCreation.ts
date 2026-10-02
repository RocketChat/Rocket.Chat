import { usePermission, useSetting } from '@rocket.chat/ui-contexts';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import { useAbacConfigQuery } from '../../../views/room/hooks/useAbacConfigQuery';

export type AbacRoomCreation = {
	enforced: boolean;
	requiredAttributes: string[];
	canCreateManaged: boolean;
};

export const isAbacCreationBlocked = (abac: AbacRoomCreation | undefined, canCreatePrivate: boolean): boolean =>
	Boolean(abac?.enforced && (!abac.canCreateManaged || !canCreatePrivate));

export const useAbacRoomCreation = (): { isLoading: boolean; abac?: AbacRoomCreation } => {
	const abacEnabled = useSetting('ABAC_Enabled', false);
	const enforceAllRooms = useSetting('ABAC_Enforce_All_Rooms', false);
	const canCreateManaged = usePermission('create-abac-managed-room');
	const { data: hasAbacModule = false, isLoading: isLicenseLoading } = useHasLicenseModule('abac');
	const { data: config, isError: isConfigError } = useAbacConfigQuery();

	if (!abacEnabled) {
		return { isLoading: false };
	}

	if (isLicenseLoading) {
		return { isLoading: true };
	}

	if (!hasAbacModule) {
		return { isLoading: false };
	}

	if (!config && !isConfigError) {
		return { isLoading: true };
	}

	return {
		isLoading: false,
		abac: {
			enforced: enforceAllRooms,
			requiredAttributes: enforceAllRooms ? (config?.requiredAttributes ?? []) : [],
			canCreateManaged,
		},
	};
};
