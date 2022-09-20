import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UploadCustomSound = {
	sound: string | ArrayBuffer;
	contentType: string;
	soundData: {
		extension: string;
		_id?: string;
		previousName?: string;
		previousSound?: {
			extension?: string;
		};
		previousExtension?: string;
		name?: string;
		newFile?: boolean;
		random?: number;
	};
};

const UploadCustomSoundSchema = {
	type: 'object',
	properties: {
		sound: {
			type: ['string', 'object'],
		},
		contentType: {
			type: 'object',
		},
		soundData: {
			type: 'object',
			properties: {
				extension: {
					type: 'string',
				},
				_id: {
					type: 'string',
					nullable: true,
				},
				previousName: {
					type: 'string',
					nullable: true,
				},
				previousSound: {
					type: 'object',
					properties: {
						extension: {
							type: 'string',
							nullable: true,
						},
					},
					additionalProperties: false,
				},
				previousExtension: {
					type: 'string',
					nullable: true,
				},
				name: {
					type: 'string',
					nullable: true,
				},
				newFile: {
					type: 'boolean',
					nullable: true,
				},
				random: {
					type: 'number',
					nullable: true,
				},
			},
			required: ['extension'],
			additionalProperties: false,
		},
	},
	required: ['sound', 'contentType', 'soundData'],
	additionalProperties: false,
};

export const isUploadCustomSoundProps = ajv.compile<UploadCustomSound>(UploadCustomSoundSchema);
