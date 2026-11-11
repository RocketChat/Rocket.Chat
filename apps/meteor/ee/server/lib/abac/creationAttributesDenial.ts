import { AbacContractError, AbacErrorCode } from '@rocket.chat/abac';
import type { AbacCreationAttributesDenialReason, AbacCreationAttributesResult } from '@rocket.chat/core-services';

type AbacCreationAttributesDenial = Extract<AbacCreationAttributesResult, { allowed: false }>;

const denials: Record<AbacCreationAttributesDenialReason, AbacErrorCode> = {
	'invalid': AbacErrorCode.InvalidAttributes,
	'not-entitled': AbacErrorCode.AttributeNotAssignable,
	'creator-not-admitted': AbacErrorCode.CreatorNotAdmitted,
	'unavailable': AbacErrorCode.DecisionUnavailable,
	'inconclusive': AbacErrorCode.DecisionInconclusive,
};

export const toCreationAttributesDenialError = ({ reason, code, key, attributes }: AbacCreationAttributesDenial): AbacContractError =>
	new AbacContractError(denials[reason], { cause: code, ...(key && { key }), ...(attributes && { attributes }) });
