import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

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
