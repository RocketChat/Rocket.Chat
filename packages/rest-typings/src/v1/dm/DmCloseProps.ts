import Ajv, { JSONSchemaType } from 'ajv';

const ajv = new Ajv();

export type DmCloseProps = {
	roomId: string;
};

const DmClosePropsSchema: JSONSchemaType<DmCloseProps> = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isDmCloseProps = ajv.compile(DmClosePropsSchema);
