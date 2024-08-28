import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type VoipFreeSwitchExtensionAssignProps = { username: string; extension?: string };

const voipFreeSwitchExtensionAssignPropsSchema: JSONSchemaType<VoipFreeSwitchExtensionAssignProps> = {
	type: 'object',
	properties: {
		username: {
			type: 'string',
			nullable: false,
		},
		extension: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['username'],
	additionalProperties: false,
};

export const isVoipFreeSwitchExtensionAssignProps = ajv.compile(voipFreeSwitchExtensionAssignPropsSchema);
