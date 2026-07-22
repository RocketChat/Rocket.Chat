import { ajvQuery } from '@rocket.chat/rest-typings';

export type ConferenceEventData = {
	guests_muted: boolean;
	is_locked: boolean;
	is_started: boolean;
	name: string;
	service_type: 'conference' | 'lecture' | 'two_stage_dialing' | 'media_playback' | 'test_call' | 'gateway';
	start_time: number;
	tag: string;
};

export type ConferenceEndedEventData = ConferenceEventData & {
	end_time: number;
};

export type ParticipantEventData = {
	uuid: string;
};

export type ParticipantStatusEventData = ParticipantEventData & {
	call_direction: 'in' | 'out';
	call_id: string;
	call_tag?: string;
	conference: string;
	connect_time: number;
	conversation_id: string;
	destination_alias: string;
	display_name: string;
	encryption: 'On' | 'Off';
	has_media: boolean;
	is_muted: boolean;
	is_presenting: boolean;
	is_streaming: boolean;
	media_node: string;
	protocol: 'WebRTC' | 'SIP' | 'H323' | 'TEAMS' | 'MSSIP' | 'GHM' | 'RTMP' | 'API';
	proxy_node: string;
	related_uuids: string[];
	remote_address: string;
	role: 'chair' | 'guest' | 'unknown';
	rx_bandwidth: number;
	service_tag: string;
	service_type: 'connecting' | 'conference' | 'lecture' | 'two_stage_dialing' | 'media_playback' | 'test_call' | 'ivr' | 'waiting_room';
	signaling_node: string;
	source_alias: string;
	system_location: string;
	tx_bandwidth: number;
	vendor: string;
};

export type ParticipantDisconnectedEventData = ParticipantStatusEventData & {
	disconnect_reason: string;
	duration: number;
	end_time: number;
};

export type EventSinkRequest = {
	node: string;
	seq: number;
	version: number;
	time: number;
} & (
	| {
			event: 'conference_started' | 'conference_updated';
			data: ConferenceEventData;
	  }
	| {
			event: 'conference_ended';
			data: ConferenceEndedEventData;
	  }
	| {
			event: 'participant_connected' | 'participant_updated';
			data: ParticipantStatusEventData;
	  }
	| {
			event: 'participant_disconnected';
			data: ParticipantDisconnectedEventData;
	  }
	| {
			event: 'participant_media_stream_window';
			data: ParticipantEventData & {
				packet_loss_history: Record<string, any>[];
				recent_quality: Record<string, any>[];
				call_quality_was: '0_unknown' | '1_good' | '2_ok' | '3_bad' | '4_terrible';
				call_quality_now: '0_unknown' | '1_good' | '2_ok' | '3_bad' | '4_terrible';
			};
	  }
	| {
			event: 'participant_media_streams_destroyed';
			data: ParticipantEventData & {
				media_streams: Record<string, any>[];
			};
	  }
	| {
			event: 'eventsink_started' | 'eventsink_updated' | 'eventsink_ended';
			data: {};
	  }
);

const eventSinkRequestSchema = {
	type: 'object',
	properties: {
		event: {
			type: 'string',
			nullable: false,
		},
		data: {
			type: 'object',
			nullable: false,
		},
	},
	required: ['event', 'data'],
	additionalProperties: true,
};

export const isEventSinkRequestProps = ajvQuery.compile<EventSinkRequest>(eventSinkRequestSchema);
