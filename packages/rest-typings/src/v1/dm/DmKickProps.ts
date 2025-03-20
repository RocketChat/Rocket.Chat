import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

type DmKickProps = {
	roomId: string;
	userId: string;
};

const DmKickPropsSchema: JSONSchemaType<DmKickProps> = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		userId: {
			type: 'string',
		},
	},
	required: ['roomId', 'userId'],
	additionalProperties: false,
};

export const isDmKickProps = ajv.compile(DmKickPropsSchema);
