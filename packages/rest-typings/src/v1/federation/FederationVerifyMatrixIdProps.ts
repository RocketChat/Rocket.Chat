import Ajv from 'ajv';

const ajv = new Ajv();

export type FederationVerifyMatrixIdProps = {
	matrixId: string;
};

const FederationVerifyMatrixIdPropsSchema = {
	type: 'object',
	properties: {
		matrixId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['matrixId'],
};

export const isFederationVerifyMatrixIdProps = ajv.compile<FederationVerifyMatrixIdProps>(FederationVerifyMatrixIdPropsSchema);
