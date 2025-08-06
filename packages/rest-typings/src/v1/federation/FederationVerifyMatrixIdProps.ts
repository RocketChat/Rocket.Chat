import { ajv } from './../Ajv';
export type FederationVerifyMatrixIdProps = {
	matrixIds: string[];
};

const FederationVerifyMatrixIdPropsSchema = {
	type: 'object',
	properties: {
		matrixIds: {
			type: 'array',
			items: { type: 'string' },
			uniqueItems: true,
			minItems: 1,
			maxItems: 15,
		},
	},
	additionalProperties: false,
	required: ['matrixIds'],
};

export const isFederationVerifyMatrixIdProps = ajv.compile<FederationVerifyMatrixIdProps>(FederationVerifyMatrixIdPropsSchema);
