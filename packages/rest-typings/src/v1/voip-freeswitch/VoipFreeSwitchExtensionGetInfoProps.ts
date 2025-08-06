import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VoipFreeSwitchExtensionGetInfoProps = {
	userId: string;
};

const voipFreeSwitchExtensionGetInfoPropsSchema: JSONSchemaType<VoipFreeSwitchExtensionGetInfoProps> = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
			nullable: false,
		},
	},
	required: ['userId'],
	additionalProperties: false,
};

export const isVoipFreeSwitchExtensionGetInfoProps = ajv.compile(voipFreeSwitchExtensionGetInfoPropsSchema);
