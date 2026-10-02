import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { findMissingRequiredKeys, toAttributeMap } from './AbacAttributesStep';
import type { AbacRoomCreation } from './useAbacRoomCreation';
import { useAssignableAttributeList } from './useAssignableAttributeList';
import type { CreateRoomStep } from './useCreateRoomSteps';
import { useAbacMembershipPreview } from '../AbacMembershipPreview/useAbacMembershipPreview';

type UseAbacCreationFlowParams = {
	abac?: AbacRoomCreation;
	isAbacManaged: boolean;
	step: CreateRoomStep;
	members: string[];
	attributes: IAbacAttributeDefinition[];
};

export const useAbacCreationFlow = ({ abac, isAbacManaged, step, members, attributes }: UseAbacCreationFlowParams) => {
	const isManaged = Boolean(abac?.canCreateManaged && isAbacManaged);
	const attributeMap = toAttributeMap(attributes);

	const assignable = useAssignableAttributeList(isManaged);
	const missingRequiredKeys = findMissingRequiredKeys(abac?.requiredAttributes ?? [], assignable.data);

	const checkAssignability = useEndpoint('POST', '/v1/abac/attribute-assignability');
	const assignability = useMutation({
		mutationFn: (attributes: Record<string, string[]>) => checkAssignability({ attributes }),
	});

	const preview = useAbacMembershipPreview(members, attributeMap, isManaged && step === 'preview');

	const isStepBlocked =
		(step === 'attributes' && (assignable.isPending || !!assignable.error || missingRequiredKeys.length > 0)) ||
		(step === 'preview' && !(preview.isSuccess && preview.data.compliant.length > 0));

	const confirmAttributes = async (): Promise<boolean> => {
		try {
			await assignability.mutateAsync(attributeMap);
			return true;
		} catch {
			return false;
		}
	};

	return {
		isManaged,
		attributeMap,
		assignable,
		assignabilityError: assignability.error,
		preview,
		isStepBlocked,
		confirmAttributes,
	};
};
