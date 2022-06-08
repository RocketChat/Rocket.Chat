import Ajv, { JSONSchemaType } from 'ajv';

const ajv = new Ajv();

export type DmLeaveProps = {
	roomId: string;
};

const DmLeavePropsSchema: JSONSchemaType<DmLeaveProps> = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isDmLeaveProps = ajv.compile(DmLeavePropsSchema);
