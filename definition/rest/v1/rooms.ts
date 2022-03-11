import Ajv, { JSONSchemaType } from 'ajv';

import type { IMessage } from '../../IMessage';
import type { IRoom } from '../../IRoom';
import type { IUser } from '../../IUser';

const ajv = new Ajv();

type roomsCreateDiscussionProps = {
	prid: IRoom['_id'];
	pmid?: IMessage['_id'];
	t_name: IRoom['fname'];
	users?: IUser['username'][];
	encrypted?: boolean;
	reply?: string;
};

const roomsCreateDiscussionPropsSchema: JSONSchemaType<roomsCreateDiscussionProps> = {
	type: 'object',
	properties: {
		prid: {
			type: 'string',
		},
		pmid: {
			type: 'string',
			nullable: true,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		t_name: {
			type: 'string',
		},
		users: {
			type: 'array',
			items: {
				type: 'string',
				nullable: true,
			},
			nullable: true,
		},
		encrypted: {
			type: 'boolean',
			nullable: true,
		},
		reply: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['prid', 't_name'],
	additionalProperties: false,
};

export const isRoomsCreateDiscussion = ajv.compile(roomsCreateDiscussionPropsSchema);

type RoomsAutocompleteChannelAndPrivate = {
	selector: string;
};

const RoomsAutocompleteChannelAndPrivateSchema: JSONSchemaType<RoomsAutocompleteChannelAndPrivate> = {
	type: 'object',
	properties: {
		selector: {
			type: 'string',
		},
	},
	required: ['selector'],
	additionalProperties: false,
};

export const isRoomsAutocompleteChannelAndPrivate = ajv.compile(RoomsAutocompleteChannelAndPrivateSchema);

type RoomsAutocompleteChannelAndPrivateWithPagination = {
	selector: string;
	offset?: number;
	count?: number;
	sort?: string;
};

const RoomsAutocompleteChannelAndPrivateWithPaginationSchema: JSONSchemaType<RoomsAutocompleteChannelAndPrivateWithPagination> = {
	type: 'object',
	properties: {
		selector: {
			type: 'string',
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['selector'],
	additionalProperties: false,
};

export const isRoomsAutocompleteChannelAndPrivateWithPagination = ajv.compile(RoomsAutocompleteChannelAndPrivateWithPaginationSchema);

type RoomsAutocompleteAvailableForTeams = {
	name: string;
};

const RoomsAutocompleteAvailableForTeamsSchema: JSONSchemaType<RoomsAutocompleteAvailableForTeams> = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
	},
	required: ['name'],
	additionalProperties: false,
};

export const isRoomsAutocompleteAvailableForTeams = ajv.compile(RoomsAutocompleteAvailableForTeamsSchema);

export type RoomsEndpoints = {
	'rooms.autocomplete.channelAndPrivate': {
		GET: (params: RoomsAutocompleteChannelAndPrivate) => {
			items: IRoom[];
		};
	};
	'rooms.autocomplete.channelAndPrivate.withPagination': {
		GET: (params: RoomsAutocompleteChannelAndPrivateWithPagination) => {
			items: IRoom[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'rooms.autocomplete.availableForTeams': {
		GET: (params: RoomsAutocompleteAvailableForTeams) => {
			items: IRoom[];
		};
	};
	'rooms.info': {
		GET: (params: { roomId: string } | { roomName: string }) => {
			room: IRoom;
		};
	};
	'rooms.createDiscussion': {
		POST: (params: roomsCreateDiscussionProps) => {
			discussion: IRoom;
		};
	};
};
