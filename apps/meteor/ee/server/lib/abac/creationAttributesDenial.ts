import { MeteorError } from '@rocket.chat/core-services';
import type { AbacCreationAttributesDenialReason, AbacCreationAttributesResult } from '@rocket.chat/core-services';

type AbacCreationAttributesDenial = Extract<AbacCreationAttributesResult, { allowed: false }>;

const denials: Record<AbacCreationAttributesDenialReason, { error: string; reason: string }> = {
	'invalid': { error: 'error-abac-invalid-attributes', reason: 'Invalid ABAC attributes' },
	'not-entitled': { error: 'error-abac-attribute-not-assignable', reason: 'ABAC attribute not assignable' },
	'unavailable': { error: 'error-abac-decision-unavailable', reason: 'ABAC access decisions are unavailable' },
	'inconclusive': { error: 'error-abac-decision-inconclusive', reason: 'ABAC access decision could not be made' },
};

export const toCreationAttributesDenialError = ({ reason, code, key, attributes }: AbacCreationAttributesDenial): MeteorError => {
	const { error, reason: message } = denials[reason];
	return new MeteorError(error, message, { cause: code, ...(key && { key }), ...(attributes && { attributes }) });
};
