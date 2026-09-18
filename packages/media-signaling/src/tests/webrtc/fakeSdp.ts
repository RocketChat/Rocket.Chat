/**
 * A minimal SDP writer and reader for the fake peer connection.
 *
 * The harness parses SDP with its own code instead of the package's `SDP` class, so a bug in the
 * parser under test cannot hide itself by also being present in the harness.
 */

export type FakeSdpMediaSection = {
	kind: 'audio' | 'video';
	mid: string;
	direction: RTCRtpTransceiverDirection;
	streamId: string | null;
	trackId: string | null;
};

export type FakeSdpDescription = {
	peerId: string;
	sections: FakeSdpMediaSection[];
};

const DIRECTIONS: RTCRtpTransceiverDirection[] = ['sendrecv', 'sendonly', 'recvonly', 'inactive'];

const CODEC_BY_KIND = {
	audio: { payload: '111', rtpmap: '111 opus/48000/2' },
	video: { payload: '96', rtpmap: '96 VP8/90000' },
} as const;

export const reverseDirection = (direction: RTCRtpTransceiverDirection): RTCRtpTransceiverDirection => {
	switch (direction) {
		case 'sendonly':
			return 'recvonly';
		case 'recvonly':
			return 'sendonly';
		default:
			return direction;
	}
};

/** The direction both peers agree on, given what each one asked for. */
export const intersectDirections = (
	local: RTCRtpTransceiverDirection,
	remote: RTCRtpTransceiverDirection,
): Exclude<RTCRtpTransceiverDirection, 'stopped'> => {
	if (local === 'stopped' || remote === 'stopped') {
		return 'inactive';
	}

	const sending = local.includes('send') && reverseDirection(remote).includes('send');
	const receiving = local.includes('recv') && reverseDirection(remote).includes('recv');

	if (sending && receiving) {
		return 'sendrecv';
	}
	if (sending) {
		return 'sendonly';
	}
	if (receiving) {
		return 'recvonly';
	}

	return 'inactive';
};

export const buildFakeSdp = ({ peerId, sections }: FakeSdpDescription): string => {
	const bundle = sections.map(({ mid }) => mid).join(' ');

	const lines = [
		'v=0',
		`o=- ${peerId} 2 IN IP4 127.0.0.1`,
		's=-',
		't=0 0',
		...(bundle ? [`a=group:BUNDLE ${bundle}`] : []),
		'a=msid-semantic: WMS *',
	];

	for (const { kind, mid, direction, streamId, trackId } of sections) {
		const codec = CODEC_BY_KIND[kind];

		lines.push(
			`m=${kind} 9 UDP/TLS/RTP/SAVPF ${codec.payload}`,
			'c=IN IP4 0.0.0.0',
			'a=rtcp-mux',
			`a=mid:${mid}`,
			`a=${direction}`,
			`a=rtpmap:${codec.rtpmap}`,
			...(streamId && trackId ? [`a=msid:${streamId} ${trackId}`] : []),
		);
	}

	return `${lines.map((line) => `${line}\r\n`).join('')}`;
};

const parseSection = (lines: string[], index: number): FakeSdpMediaSection | null => {
	const kind = lines[0]?.match(/^m=(audio|video)/)?.[1] as 'audio' | 'video' | undefined;
	if (!kind) {
		return null;
	}

	const section: FakeSdpMediaSection = { kind, mid: String(index), direction: 'inactive', streamId: null, trackId: null };

	for (const line of lines) {
		const mid = line.match(/^a=mid:(.+)$/)?.[1];
		if (mid) {
			section.mid = mid;
			continue;
		}

		const direction = line.match(/^a=(sendrecv|sendonly|recvonly|inactive)$/)?.[1] as RTCRtpTransceiverDirection | undefined;
		if (direction && DIRECTIONS.includes(direction)) {
			section.direction = direction;
			continue;
		}

		const msid = line.match(/^a=msid:(\S+)\s+(\S+)$/);
		if (msid && msid[1] !== '-') {
			[, section.streamId, section.trackId] = msid;
		}
	}

	return section;
};

export const parseFakeSdp = (sdp: string): FakeSdpDescription => {
	const peerId = sdp.match(/^o=\S+ (\S+) /m)?.[1] || '';
	const sections: FakeSdpMediaSection[] = [];

	let current: string[] | null = null;

	const closeSection = () => {
		if (!current) {
			return;
		}

		const section = parseSection(current, sections.length);
		if (section) {
			sections.push(section);
		}
		current = null;
	};

	for (const line of sdp.split(/\r?\n/)) {
		if (line.startsWith('m=')) {
			closeSection();
			current = [line];
			continue;
		}

		current?.push(line);
	}
	closeSection();

	return { peerId, sections };
};
