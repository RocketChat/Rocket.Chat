import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type VoipFreeSwitchExtensionGetDetailsProps = {
	extension: string;
	group?: string;
};

const voipFreeSwitchExtensionGetDetailsPropsSchema: JSONSchemaType<VoipFreeSwitchExtensionGetDetailsProps> = {
	type: 'object',
	properties: {
		extension: {
			type: 'string',
			nullable: false,
		},
		group: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['extension'],
	additionalProperties: false,
};

export const isVoipFreeSwitchExtensionGetDetailsProps = ajv.compile(voipFreeSwitchExtensionGetDetailsPropsSchema);
