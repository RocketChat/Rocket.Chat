import Ajv from 'ajv';

const ajv = new Ajv();

export type FederationVerifyMatrixIdProps = {
	matrixIds: string[];
};

const FederationVerifyMatrixIdPropsSchema = {
	type: 'object',
	properties: {
		matrixIds: {
			type: 'array',
			items: [{ type: 'string' }],
			uniqueItems: true,
		},
	},
	additionalProperties: false,
	required: ['matrixIds'],
};

export const isFederationVerifyMatrixIdProps = ajv.compile<FederationVerifyMatrixIdProps>(FederationVerifyMatrixIdPropsSchema);
