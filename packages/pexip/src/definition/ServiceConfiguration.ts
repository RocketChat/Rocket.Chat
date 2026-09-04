import { ajvQuery } from '@rocket.chat/rest-typings';

import type { PexipLayout } from './PexipLayout';

type Toggle = 'default' | 'yes' | 'no';
type CallType = 'video' | 'video-only' | 'audio';

type AutomaticParticipant = {
	local_alias: string;
	protocol: 'h323' | 'sip' | 'mssip' | 'rtmp';
	remote_alias: string;
	role: 'chair' | 'guest';
	call_type?: 'video' | 'video-only' | 'audio';
	dtmf_sequence?: string;
	keep_conference_alive?: 'keep_conference_alive' | 'keep_conference_alive_if_multiple' | 'keep_conference_alive_never';
	local_display_name?: string;
	presentation_url?: string;
	remote_display_name?: string;
	routing?: 'manual' | 'routing_rule';
	streaming?: boolean;
	system_location_name?: string;
};

// Attributes common to all services
type BaseServiceConfiguration = {
	name: string;
	service_tag: string;
	description?: string;
	ivr_theme_name?: string;
	max_callrate_in?: number;
	max_callrate_out?: number;
	max_pixels_per_second?: 'sd' | 'hd' | 'fullhd' | null;
};

// Attributes common to all calls (everything but media playback)
type BaseCallConfiguration = BaseServiceConfiguration & {
	bypass_proxy?: boolean;
	call_type?: CallType;
	crypto_mode?: 'besteffort' | 'on' | 'off' | null;
	local_display_name?: string;
};

// Attributes common to both meeting room types (conferences and lectures)
type BaseMeetingRoom = BaseCallConfiguration & {
	allow_guests?: boolean;
	automatic_participants?: AutomaticParticipant[];
	enable_chat?: Toggle;
	enable_active_speaker_indication?: boolean;
	enable_overlay_text?: boolean;
	guest_pin?: string;
	guests_can_present?: boolean;
	guest_identity_provider_group?: string;
	host_identity_provider_group?: string;
	locked?: boolean;
	non_idp_participants?: 'disallow_all' | 'allow_if_trusted';
	participant_limit?: number;
	pin?: string;
	prefer_ipv6?: Toggle;
	primary_owner_email_address?: string;
};

// Virtual Meeting Room (VMR) Service Configuration
export type MeetingRoom = BaseMeetingRoom & {
	service_type: 'conference';
	view?: PexipLayout;
};

// Virtual Auditorium Service Configuration
export type Auditorium = BaseMeetingRoom & {
	service_type: 'lecture';
	force_presenter_into_main?: boolean;
	guest_view?: PexipLayout;
	host_view?: PexipLayout;
	mute_all_guests?: boolean;
};

// Gateway Service Configuration (Integration with third parties)
export type Gateway = BaseCallConfiguration & {
	service_type: 'gateway';
	local_alias: string;
	outgoing_protocol: 'h323' | 'sip' | 'mssip' | 'rtmp' | 'gms' | 'teams';
	remote_alias: string;
	call_type?: CallType | 'auto';
	called_device_type?:
		| 'external'
		| 'registration'
		| 'mssip_conference_id'
		| 'mssip_server'
		| 'gms_conference'
		| 'teams_conference'
		| 'telehealth_profile';
	enable_active_speaker_indication?: boolean;
	enable_overlay_text?: boolean;
	external_participant_avatar_lookup?: Toggle;
	gms_access_token_name?: string;
	h323_gatekeeper_name?: string;
	mssip_proxy_name?: string;
	outgoing_location_name?: string;
	prefer_ipv6?: Toggle;
	sip_proxy_name?: string;
	stun_server_name?: string;
	teams_proxy_name?: string;
	treat_as_trusted?: boolean;
	turn_server_name?: string;
	view?: PexipLayout;
};

// Virtual Reception Service Configuration
export type Reception = BaseCallConfiguration & {
	service_type: 'two_stage_dialing';
	gms_access_token_name?: string;
	match_string?: string;
	mssip_proxy_name?: string;
	post_match_string?: string;
	post_replace_string?: string;
	replace_string?: string;
	system_location_name?: string;
	teams_proxy_name?: string;
	two_stage_dial_type?: 'regular' | 'mssip' | 'gms' | 'teams';
};

// Media Playback Service Configuration
export type MediaPlayback = BaseServiceConfiguration & {
	service_type: 'media_playback';
	allow_guests?: boolean;
	guest_pin?: string;
	guest_identity_provider_group?: string;
	host_identity_provider_group?: string;
	media_playlist_name?: string;
	non_idp_participants?: 'disallow_all' | 'allow_if_trusted';
	on_completion?: string;
	pin?: string;
};

// Test Call Service Configuration
export type TestCall = Omit<BaseCallConfiguration, 'max_callrate_out'> & {
	service_type: 'test_call';
};

export type ServiceConfiguration = MeetingRoom | Auditorium | Gateway | Reception | MediaPlayback | TestCall;

const serviceConfigurationSchema = {
	type: 'object',
	properties: {
		service_type: { type: 'string', nullable: false },
		name: { type: 'string', nullable: false },
		service_tag: { type: 'string', nullable: false },
		description: { type: 'string', nullable: true },
		pin: { type: 'string', nullable: true },
		allow_guests: { type: 'boolean', nullable: true },
		guest_pin: { type: 'string', nullable: true },
		locked: { type: 'boolean', nullable: true },
		ivr_theme_name: { type: 'string', nullable: true },
		call_type: { type: 'string', nullable: true },
		view: { type: 'string', nullable: true },
		local_display_name: { type: 'string', nullable: true },
		enable_overlay_text: { type: 'boolean', nullable: true },
	},
	required: ['service_type', 'name', 'service_tag'],
	additionalProperties: true,
};

export const isServiceConfiguration = ajvQuery.compile<ServiceConfiguration>(serviceConfigurationSchema);
