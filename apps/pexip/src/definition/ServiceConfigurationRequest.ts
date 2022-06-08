export type ServiceConfigurationRequest = {
	bandwidth: unknown;
	call_direction: 'dial_in' | 'dial_out' | 'non_dial';
	call_tag: unknown;
	local_alias: unknown;
	location: unknown;
	'ms-subnet'?: unknown;
	node_ip: unknown;
	'p_Asserted-Identity'?: unknown;
	protocol: 'api' | 'webrtc' | 'sip' | 'rtmp' | 'h323' | 'mssip';
	pseudo_version_id: unknown;
	registered: boolean;
	remote_address: unknown;
	remote_alias: unknown;
	remote_display_name: unknown;
	remote_port: unknown;
	service_name?: unknown;
	service_tag?: unknown;
	telehealth_request_id?: unknown;
	trigger: 'web' | 'web_avatar_fetch' | 'invite' | 'options' | 'subscribe' | 'setup' | 'arq' | 'irq' | 'unspecified';
	unique_service_name?: unknown;
	vendor: unknown;
	version_id: unknown;
};

export type SerializedServiceConfigurationRequest = { [K in keyof ServiceConfigurationRequest]: string | undefined };
