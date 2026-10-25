import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { findMissingRequiredKeys, toAttributeMap } from './AbacAttributesStep';
import { useAssignableAttributes } from './useAbacRoomCreation';
import type { AbacRoomCreation } from './useAbacRoomCreation';
import { useCreateRoomSteps } from './useCreateRoomSteps';
import { ABACQueryKeys } from '../../../lib/queryKeys';

type UseAbacCreationFlowParams = {
	abac?: AbacRoomCreation;
	isAbacManaged: boolean;
	members: string[];
	attributes: IAbacAttributeDefinition[];
};

export const getInitialAbacAttributes = (abac?: AbacRoomCreation): IAbacAttributeDefinition[] =>
	abac?.requiredAttributes.length ? abac.requiredAttributes.map((key) => ({ key, values: [] })) : [{ key: '', values: [] }];

export const useAbacCreationFlow = ({ abac, isAbacManaged, members, attributes }: UseAbacCreationFlowParams) => {
	const isManaged = Boolean(abac?.canCreateManaged && isAbacManaged);
	const attributeMap = toAttributeMap(attributes);
	const steps = useCreateRoomSteps(Boolean(abac), isManaged);
	const { step } = steps;

	const assignable = useAssignableAttributes({ enabled: isManaged, select: (data) => data.attributes });
	const missingRequiredKeys = findMissingRequiredKeys(abac?.requiredAttributes ?? [], assignable.data);

	const previewMembership = useEndpoint('POST', '/v1/abac/rooms.evaluateMembership');
	const preview = useQuery({
		queryKey: ABACQueryKeys.membershipPreview(members, attributeMap),
		queryFn: async () => {
			const result = await previewMembership({ members, attributes: attributeMap });
			if (!('compliant' in result)) {
				throw new Error('Unexpected membership preview response');
			}
			return result;
		},
		enabled: isManaged && step === 'preview' && Object.keys(attributeMap).length > 0,
		refetchOnWindowFocus: false,
	});

	const isStepBlocked =
		(step === 'attributes' && (assignable.isPending || !!assignable.error || missingRequiredKeys.length > 0)) ||
		(step === 'preview' && !(preview.isSuccess && !preview.isFetching && preview.data.compliant.length > 0));

	const submitStep = async (create: () => Promise<void>): Promise<void> => {
		if (steps.isLast) {
			return create();
		}

		steps.next();
	};

	return {
		...steps,
		isManaged,
		attributeMap,
		assignable,
		preview,
		isStepBlocked,
		submitStep,
	};
};
