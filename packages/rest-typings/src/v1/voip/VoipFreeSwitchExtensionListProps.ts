import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type VoipFreeSwitchExtensionListProps = {
	username?: string;
	type?: 'available' | 'free' | 'allocated' | 'all';
};

const voipFreeSwitchExtensionListPropsSchema: JSONSchemaType<VoipFreeSwitchExtensionListProps> = {
	type: 'object',
	properties: {
		username: {
			type: 'string',
			nullable: true,
		},
		type: {
			type: 'string',
			enum: ['available', 'free', 'allocated', 'all'],
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isVoipFreeSwitchExtensionListProps = ajv.compile(voipFreeSwitchExtensionListPropsSchema);
