import Ajv from 'ajv';

const ajv = new Ajv({ coerceTypes: true });

export type ModalsInsertProps = {
	title: string;
	content: string;
	contentType: 'markdown' | 'text';
	expires: Date;
};

export const isModalsInsertProps = ajv.compile<ModalsInsertProps>({
	type: 'object',
	properties: {
		title: {
			type: 'string',
		},
		content: {
			type: 'string',
		},
		contentType: {
			type: 'string',
			enum: ['markdown', 'text'],
		},
		expires: {
			type: 'string',
		},
	},
	required: ['title', 'content', 'contentType', 'expires'],
	additionalProperties: false,
});
