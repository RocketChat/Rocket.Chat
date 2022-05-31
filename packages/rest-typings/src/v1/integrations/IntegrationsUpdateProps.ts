import Ajv from 'ajv';
import type { OutgoingIntegrationEvent } from '@rocket.chat/core-typings';

const ajv = new Ajv();

export type IntegrationsUpdateProps =
	| {
			type: 'webhook-incoming';
			integrationId: string;
			channel: string;
			scriptEnabled: boolean;
			script?: string;
			name: string;
			enabled: boolean;
			alias?: string;
			avatar?: string;
			emoji?: string;
	  }
	| {
			type: 'webhook-outgoing';
			integrationId?: string;
			target_url?: string;
			username: string;
			channel: string;

			event: OutgoingIntegrationEvent;
			targetRoom?: string;
			urls?: string[];
			triggerWords?: string[];
			triggerWordAnywhere?: boolean;
			token?: string;

			scriptEnabled: boolean;
			script?: string;
			runOnEdits?: boolean;

			retryFailedCalls?: boolean;
			retryCount?: number;
			retryDelay?: string;
			impersonateUser?: boolean;

			name: string;
			enabled: boolean;

			alias?: string;
			avatar?: string;
			emoji?: string;
	  };

const integrationsUpdateSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				type: {
					type: 'string',
					pattern: 'webhook-incoming',
					nullable: false,
				},
				integrationId: {
					type: 'string',
					nullable: false,
				},
				channel: {
					type: 'string',
					nullable: false,
				},
				scriptEnabled: {
					type: 'boolean',
					nullable: false,
				},
				script: {
					type: 'string',
					nullable: true,
				},
				name: {
					type: 'string',
					nullable: false,
				},
				enabled: {
					type: 'boolean',
					nullable: false,
				},
				alias: {
					type: 'string',
					nullable: true,
				},
				avatar: {
					type: 'string',
					nullable: true,
				},
				emoji: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['integrationId', 'type', 'channel', 'scriptEnabled', 'name', 'enabled'],
			additionalProperties: true,
		},
		{
			type: 'object',
			properties: {
				type: {
					type: 'string',
					pattern: 'webhook-outgoing',
					nullable: false,
				},
				integrationId: {
					type: 'string',
					nullable: true,
				},
				// eslint-disable-next-line @typescript-eslint/camelcase
				target_url: {
					type: 'string',
					nullable: true,
				},
				username: {
					type: 'string',
					nullable: false,
				},
				channel: {
					type: 'string',
					nullable: false,
				},
				event: {
					type: 'string',
					nullable: false,
				},
				targetRoom: {
					type: 'string',
					nullable: true,
				},
				urls: {
					type: 'array',
					items: {
						type: 'string',
						minLength: 1,
					},
					nullable: true,
				},
				triggerWords: {
					type: 'array',
					items: {
						type: 'string',
						minLength: 1,
					},
					nullable: true,
				},
				triggerWordAnywhere: {
					type: 'boolean',
					nullable: true,
				},
				token: {
					type: 'string',
					nullable: true,
				},
				scriptEnabled: {
					type: 'boolean',
					nullable: false,
				},
				script: {
					type: 'string',
					nullable: true,
				},
				runOnEdits: {
					type: 'boolean',
					nullable: true,
				},
				retryFailedCalls: {
					type: 'boolean',
					nullable: true,
				},
				retryCount: {
					type: 'number',
					nullable: true,
				},
				retryDelay: {
					type: 'string',
					nullable: true,
				},
				impersonateUser: {
					type: 'boolean',
					nullable: true,
				},
				name: {
					type: 'string',
					nullable: false,
				},
				enabled: {
					type: 'boolean',
					nullable: false,
				},
				alias: {
					type: 'string',
					nullable: true,
				},
				avatar: {
					type: 'string',
					nullable: true,
				},
				emoji: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['type', 'username', 'channel', 'event', 'scriptEnabled', 'name', 'enabled'],
			additionalProperties: false,
		},
	],
};

export const isIntegrationsUpdateProps = ajv.compile<IntegrationsUpdateProps>(integrationsUpdateSchema);
