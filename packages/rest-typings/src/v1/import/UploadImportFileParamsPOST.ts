import { ajv } from '../../helpers/schemas';

export type UploadImportFileParamsPOST = {
	binaryContent: string;
	contentType: string;
	fileName: string;
	importerKey: string;
};

const UploadImportFileParamsPostSchema = {
	type: 'object',
	properties: {
		binaryContent: {
			type: 'string',
		},
		contentType: {
			type: 'string',
		},
		fileName: {
			type: 'string',
		},
		importerKey: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['binaryContent', 'contentType', 'fileName', 'importerKey'],
};

export const isUploadImportFileParamsPOST = ajv.compile<UploadImportFileParamsPOST>(UploadImportFileParamsPostSchema);
