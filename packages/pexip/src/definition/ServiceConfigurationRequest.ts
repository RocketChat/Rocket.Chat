import { ajvQuery } from '@rocket.chat/rest-typings';

export type ServiceConfigurationRequest = {
	'bandwidth': unknown;
	'call_direction': 'dial_in' | 'dial_out' | 'non_dial';
	'call_tag': string;
	'local_alias': string;
	'location': string;
	'ms-subnet'?: unknown;
	'node_ip': string;
	'p_Asserted-Identity'?: unknown;
	'protocol': 'api' | 'webrtc' | 'sip' | 'rtmp' | 'h323' | 'mssip';
	'pseudo_version_id': unknown;
	'registered': boolean;
	'remote_address': string;
	'remote_alias': string;
	'remote_display_name': string;
	'remote_port': unknown;
	'service_name'?: unknown;
	'service_tag'?: unknown;
	'telehealth_request_id'?: unknown;
	'trigger': 'web' | 'web_avatar_fetch' | 'invite' | 'options' | 'subscribe' | 'setup' | 'arq' | 'irq' | 'unspecified';
	'unique_service_name'?: unknown;
	'vendor': unknown;
	'version_id': unknown;
};

export type SerializedServiceConfigurationRequest = { [K in keyof ServiceConfigurationRequest]: string | undefined };

const serviceConfigurationRequestSchema = {
	type: 'object',
	properties: {
		local_alias: {
			type: 'string',
			nullable: false,
		},
	},
	required: ['local_alias'],
	additionalProperties: true,
};

export const isServiceConfigurationRequestProps =
	ajvQuery.compile<SerializedServiceConfigurationRequest>(serviceConfigurationRequestSchema);
