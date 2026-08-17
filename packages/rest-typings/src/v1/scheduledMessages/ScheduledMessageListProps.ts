import { ajvQuery } from '../Ajv';

export type ScheduledMessageListProps = {
	/** Restricts the listing to a single room. */
	rid?: string;
	count?: number;
	offset?: number;
};

const scheduledMessageListPropsSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isScheduledMessageListProps = ajvQuery.compile<ScheduledMessageListProps>(scheduledMessageListPropsSchema);
