import type { Serialized } from '@rocket.chat/core-typings';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { useHasLicenseModule } from '@rocket.chat/ui-client';
import { useEndpoint, usePermission, useSetting } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { ABACQueryKeys } from '../../../lib/queryKeys';

export type AbacRoomCreation = {
	enforced: boolean;
	requiredAttributes: string[];
	canCreateManaged: boolean;
};

type AssignableAttributes = Serialized<OperationResult<'GET', '/v1/abac/attributes.listAssignable'>>;

type UseAssignableAttributesOptions<TData> = {
	enabled?: boolean;
	select?: (data: AssignableAttributes) => TData;
	rid?: string;
};

export const useAssignableAttributes = <TData = AssignableAttributes>({
	enabled = true,
	select,
	rid,
}: UseAssignableAttributesOptions<TData> = {}) => {
	const getAssignableAttributes = useEndpoint('GET', '/v1/abac/attributes.listAssignable');

	return useQuery({
		queryKey: ABACQueryKeys.assignableAttributes(rid),
		queryFn: () => getAssignableAttributes(rid ? { rid } : {}),
		enabled,
		select,
		staleTime: 15_000,
		refetchOnWindowFocus: false,
	});
};

export const isAbacCreationBlocked = (abac: AbacRoomCreation | undefined, canCreatePrivate: boolean, federated = false): boolean =>
	Boolean(!federated && abac?.enforced && (!abac.canCreateManaged || !canCreatePrivate));

export const useAbacRoomCreation = (): { isLoading: boolean; abac?: AbacRoomCreation } => {
	const abacEnabled = useSetting('ABAC_Enabled', false);
	const enforceAllRooms = useSetting('ABAC_Enforce_All_Rooms', false);
	const canCreateManaged = usePermission('create-abac-managed-room');
	const { data: hasAbacModule = false, isLoading: isLicenseLoading } = useHasLicenseModule('abac');
	const { data: requiredAttributes = [], isPending: isRequiredAttributesPending } = useAssignableAttributes({
		enabled: abacEnabled && hasAbacModule && canCreateManaged,
		select: (data) => data.requiredKeys,
	});

	if (!abacEnabled) {
		return { isLoading: false };
	}

	if (isLicenseLoading) {
		return { isLoading: true };
	}

	if (!hasAbacModule) {
		return { isLoading: false };
	}

	if (canCreateManaged && isRequiredAttributesPending) {
		return { isLoading: true };
	}

	return {
		isLoading: false,
		abac: {
			enforced: enforceAllRooms,
			requiredAttributes,
			canCreateManaged,
		},
	};
};
