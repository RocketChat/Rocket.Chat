import { ajv } from '../Ajv';

export type VideoConfStartProps = {
	roomId: string;
	title?: string;
	allowRinging?: boolean;
	/** The address of a link of the room to start its conference, or to answer the one already live from it. */
	customUrl?: string;
};

// Not a `JSONSchemaType`: it would make the optional `customUrl` nullable, and a `null` address is no address.
const videoConfStartPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			nullable: false,
		},
		title: {
			type: 'string',
			nullable: true,
		},
		allowRinging: {
			type: 'boolean',
			nullable: true,
		},
		customUrl: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isVideoConfStartProps = ajv.compile<VideoConfStartProps>(videoConfStartPropsSchema);
