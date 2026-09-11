import { MediaDescription, SDP } from './sdp';

const CRLF = '\r\n';

const audioMediaLines = ['m=audio 9 UDP/TLS/RTP/SAVPF 111', 'c=IN IP4 0.0.0.0', 'a=mid:0', 'a=msid:audio-stream audio-track', 'a=sendrecv'];

const videoMediaLines = [
	'm=video 9 UDP/TLS/RTP/SAVPF 96',
	'c=IN IP4 0.0.0.0',
	'a=mid:1',
	'a=msid:video-stream video-track',
	'a=content:slides',
	'a=sendrecv',
];

const headerLines = ['v=0', 'o=- 4611731400430051336 2 IN IP4 127.0.0.1', 's=-', 't=0 0', 'a=group:BUNDLE 0 1'];

const buildSDP = (lines: string[], delimiter = CRLF, trailing = true): string => {
	const body = lines.join(delimiter);
	return trailing ? `${body}${delimiter}` : body;
};

const sampleSDP = buildSDP([...headerLines, ...audioMediaLines, ...videoMediaLines]);

// A realistic screen-share negotiation with what is currently supported: an
// audio-only `main` stream and a `slides` screen-share video stream, both
// content tags already present.
const screenShareMediaLines = [
	...headerLines,
	'm=audio 9 UDP/TLS/RTP/SAVPF 111',
	'a=mid:0',
	'a=msid:main-stream audio-track',
	'a=content:main',
	'a=sendrecv',
	'm=video 9 UDP/TLS/RTP/SAVPF 96',
	'a=mid:1',
	'a=msid:screen-stream screen-track',
	'a=content:slides',
	'a=sendrecv',
];

// Same negotiation but with a camera video track on the `main` stream.
const screenShareWithCameraMediaLines = [
	...headerLines,
	'm=video 9 UDP/TLS/RTP/SAVPF 96',
	'a=mid:0',
	'a=msid:main-stream camera-track',
	'a=content:main',
	'a=sendrecv',
	'm=video 9 UDP/TLS/RTP/SAVPF 96',
	'a=mid:1',
	'a=msid:screen-stream screen-track',
	'a=content:slides',
	'a=sendrecv',
];

// A full browser-generated offer as it arrives before any tagging: an audio
// `main` stream and a video screen-share stream, neither carrying an
// `a=content:` line yet. This is the common input to the mutation function.
const untaggedOfferLines = [
	'v=0',
	'o=- 4611731400430051336 2 IN IP4 127.0.0.1',
	's=-',
	't=0 0',
	'a=group:BUNDLE 0 1',
	'a=extmap-allow-mixed',
	'a=msid-semantic: WMS main-stream screen-stream',
	'm=audio 9 UDP/TLS/RTP/SAVPF 111 63',
	'c=IN IP4 0.0.0.0',
	'a=rtcp:9 IN IP4 0.0.0.0',
	'a=ice-ufrag:4ZcD',
	'a=ice-pwd:by2Xr5jL6i2S3NqZ0P0m0Xa8',
	'a=fingerprint:sha-256 8F:32:1A:0B:44:9C:2E:11:7D:6F:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45',
	'a=setup:actpass',
	'a=mid:0',
	'a=sendrecv',
	'a=msid:main-stream audio-track',
	'a=rtcp-mux',
	'a=rtpmap:111 opus/48000/2',
	'm=video 9 UDP/TLS/RTP/SAVPF 96 97',
	'c=IN IP4 0.0.0.0',
	'a=rtcp:9 IN IP4 0.0.0.0',
	'a=ice-ufrag:4ZcD',
	'a=ice-pwd:by2Xr5jL6i2S3NqZ0P0m0Xa8',
	'a=fingerprint:sha-256 8F:32:1A:0B:44:9C:2E:11:7D:6F:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45',
	'a=setup:actpass',
	'a=mid:1',
	'a=sendrecv',
	'a=msid:screen-stream screen-track',
	'a=rtcp-mux',
	'a=rtpmap:96 VP8/90000',
];

describe('MediaDescription', () => {
	describe('media type parsing', () => {
		it('should parse the media type from the m= line', () => {
			expect(new MediaDescription(['m=audio 9 UDP/TLS/RTP/SAVPF 111']).type).toBe('audio');
			expect(new MediaDescription(['m=video 9 UDP/TLS/RTP/SAVPF 96']).type).toBe('video');
			expect(new MediaDescription(['m=application 9 UDP/DTLS/SCTP webrtc-datachannel']).type).toBe('application');
		});

		it('should return null when there is no m= line', () => {
			expect(new MediaDescription(['a=mid:0', 'a=sendrecv']).type).toBeNull();
		});

		it('should only use the first m= line to determine the type', () => {
			const media = new MediaDescription(['m=audio 9 UDP/TLS/RTP/SAVPF 111', 'm=video 9 UDP/TLS/RTP/SAVPF 96']);
			expect(media.type).toBe('audio');
		});
	});

	describe('stream id parsing', () => {
		it('should parse a stream id from the a=msid line', () => {
			const media = new MediaDescription(['m=audio 9 UDP/TLS/RTP/SAVPF 111', 'a=msid:audio-stream audio-track']);
			expect(media.streamIds).toEqual(['audio-stream']);
		});

		it('should parse a stream id even without a track id', () => {
			const media = new MediaDescription(['a=msid:audio-stream']);
			expect(media.streamIds).toEqual(['audio-stream']);
		});

		it('should ignore the "-" placeholder stream id', () => {
			const media = new MediaDescription(['a=msid:- audio-track']);
			expect(media.streamIds).toEqual([]);
		});

		it('should ignore an empty stream id', () => {
			const media = new MediaDescription(['a=msid: audio-track']);
			expect(media.streamIds).toEqual([]);
		});

		it('should deduplicate repeated stream ids', () => {
			const media = new MediaDescription(['a=msid:stream track-a', 'a=msid:stream track-b']);
			expect(media.streamIds).toEqual(['stream']);
		});

		it('should collect multiple distinct stream ids', () => {
			const media = new MediaDescription(['a=msid:stream-a track-a', 'a=msid:stream-b track-b']);
			expect(media.streamIds).toEqual(['stream-a', 'stream-b']);
		});

		it('should return an empty array when there is no msid line', () => {
			const media = new MediaDescription(['m=audio 9 UDP/TLS/RTP/SAVPF 111']);
			expect(media.streamIds).toEqual([]);
		});
	});

	describe('content parsing', () => {
		it('should parse the content tag from the a=content line', () => {
			const media = new MediaDescription(['m=video 9 UDP/TLS/RTP/SAVPF 96', 'a=content:slides']);
			expect(media.content).toBe('slides');
		});

		it('should return null when there is no content line', () => {
			const media = new MediaDescription(['m=video 9 UDP/TLS/RTP/SAVPF 96']);
			expect(media.content).toBeNull();
		});

		it('should return null for an empty content value', () => {
			const media = new MediaDescription(['a=content:']);
			expect(media.content).toBeNull();
		});
	});

	describe('lines', () => {
		it('should expose a copy of the given lines', () => {
			const input = ['m=audio 9 UDP/TLS/RTP/SAVPF 111', 'a=sendrecv'];
			const media = new MediaDescription(input);

			expect(media.lines).toEqual(input);
			expect(media.lines).not.toBe(input);
		});

		it('should not be affected by mutations to the original array', () => {
			const input = ['m=audio 9 UDP/TLS/RTP/SAVPF 111'];
			const media = new MediaDescription(input);
			input.push('a=sendrecv');

			expect(media.lines).toEqual(['m=audio 9 UDP/TLS/RTP/SAVPF 111']);
		});
	});

	describe('setContent', () => {
		it('should add a content line when none exists', () => {
			const media = new MediaDescription(['m=video 9 UDP/TLS/RTP/SAVPF 96', 'a=sendrecv']);
			media.setContent('slides');

			expect(media.content).toBe('slides');
			expect(media.lines).toEqual(['m=video 9 UDP/TLS/RTP/SAVPF 96', 'a=sendrecv', 'a=content:slides']);
		});

		it('should replace an existing content line', () => {
			const media = new MediaDescription(['m=video 9 UDP/TLS/RTP/SAVPF 96', 'a=content:slides', 'a=sendrecv']);
			media.setContent('main');

			expect(media.content).toBe('main');
			expect(media.lines).toEqual(['m=video 9 UDP/TLS/RTP/SAVPF 96', 'a=sendrecv', 'a=content:main']);
			expect(media.lines.filter((line) => line.startsWith('a=content:'))).toHaveLength(1);
		});

		it('should remove the content line when set to null', () => {
			const media = new MediaDescription(['m=video 9 UDP/TLS/RTP/SAVPF 96', 'a=content:slides', 'a=sendrecv']);
			media.setContent(null);

			expect(media.content).toBeNull();
			expect(media.lines).toEqual(['m=video 9 UDP/TLS/RTP/SAVPF 96', 'a=sendrecv']);
		});

		it('should be a no-op when the value does not change', () => {
			const media = new MediaDescription(['m=video 9 UDP/TLS/RTP/SAVPF 96', 'a=content:slides', 'a=sendrecv']);
			const linesBefore = media.lines;
			media.setContent('slides');

			expect(media.lines).toBe(linesBefore);
			expect(media.content).toBe('slides');
		});
	});
});

describe('SDP', () => {
	describe('parsing', () => {
		it('should split header lines from media descriptions', () => {
			const sdp = new SDP(sampleSDP);
			expect(sdp.medias).toHaveLength(2);
			expect(sdp.medias[0].type).toBe('audio');
			expect(sdp.medias[1].type).toBe('video');
		});

		it('should assign each media its own set of lines', () => {
			const sdp = new SDP(sampleSDP);
			expect(sdp.medias[0].lines[0]).toBe('m=audio 9 UDP/TLS/RTP/SAVPF 111');
			expect(sdp.medias[1].lines[0]).toBe('m=video 9 UDP/TLS/RTP/SAVPF 96');
		});

		it('should parse stream ids and content per media', () => {
			const sdp = new SDP(sampleSDP);
			expect(sdp.medias[0].streamIds).toEqual(['audio-stream']);
			expect(sdp.medias[0].content).toBeNull();
			expect(sdp.medias[1].streamIds).toEqual(['video-stream']);
			expect(sdp.medias[1].content).toBe('slides');
		});

		it('should handle SDPs delimited with \\n only', () => {
			const sdp = new SDP(buildSDP([...headerLines, ...audioMediaLines, ...videoMediaLines], '\n'));
			expect(sdp.medias).toHaveLength(2);
			expect(sdp.medias[0].type).toBe('audio');
		});

		it('should produce no media descriptions when there are no m= lines', () => {
			const sdp = new SDP(buildSDP(headerLines));
			expect(sdp.medias).toHaveLength(0);
		});

		it('should handle an empty string', () => {
			const sdp = new SDP('');
			expect(sdp.medias).toHaveLength(0);
		});
	});

	describe('joinLines', () => {
		it('should round-trip an SDP delimited with CRLF', () => {
			const sdp = new SDP(sampleSDP);
			expect(sdp.joinLines()).toBe(sampleSDP);
		});

		it('should serialize using CRLF delimiters', () => {
			const sdp = new SDP(buildSDP([...headerLines, ...audioMediaLines], '\n'));
			const output = sdp.joinLines();
			expect(output).toContain(CRLF);
			expect(output).toBe(buildSDP([...headerLines, ...audioMediaLines], CRLF));
		});

		it('should not append a delimiter to empty lines', () => {
			const sdp = new SDP(`${headerLines.join(CRLF)}${CRLF}`);
			expect(sdp.joinLines()).not.toContain(`${CRLF}${CRLF}`);
		});
	});

	describe('setContentMediaByStreamId', () => {
		it('should set the content on the media owning the stream id', () => {
			const sdp = new SDP(sampleSDP);
			sdp.setContentMediaByStreamId('audio-stream', 'main');

			expect(sdp.medias[0].content).toBe('main');
			expect(sdp.medias[1].content).toBe('slides');
		});

		it('should do nothing when no media owns the stream id', () => {
			const sdp = new SDP(sampleSDP);
			sdp.setContentMediaByStreamId('unknown-stream', 'main');

			expect(sdp.medias[0].content).toBeNull();
			expect(sdp.medias[1].content).toBe('slides');
		});
	});

	describe('mutateSDPWithStreamContents', () => {
		it('should return the SDP unchanged when no streams are given', () => {
			expect(SDP.mutateSDPWithStreamContents(sampleSDP, [])).toBe(sampleSDP);
		});

		it('should add content tags to the matching media', () => {
			const output = SDP.mutateSDPWithStreamContents(sampleSDP, [{ id: 'audio-stream', content: 'main' }]);
			expect(output).toContain(`a=content:main${CRLF}`);
			expect(SDP.getStreamContentMapFromSDP(output)).toEqual({
				'audio-stream': 'main',
				'video-stream': 'slides',
			});
		});

		it('should apply multiple stream contents at once', () => {
			const output = SDP.mutateSDPWithStreamContents(sampleSDP, [
				{ id: 'audio-stream', content: 'main' },
				{ id: 'video-stream', content: 'speaker' },
			]);
			expect(SDP.getStreamContentMapFromSDP(output)).toEqual({
				'audio-stream': 'main',
				'video-stream': 'speaker',
			});
		});

		it('should ignore stream ids that are not present', () => {
			const output = SDP.mutateSDPWithStreamContents(sampleSDP, [{ id: 'ghost-stream', content: 'main' }]);
			expect(SDP.getStreamContentMapFromSDP(output)).toEqual({ 'video-stream': 'slides' });
		});

		describe('on a full offer with no content tags (common case)', () => {
			it('should confirm the sample offer starts with no content tags', () => {
				expect(buildSDP(untaggedOfferLines)).not.toContain('a=content:');
				expect(SDP.getStreamContentMapFromSDP(buildSDP(untaggedOfferLines))).toEqual({});
			});

			it('should tag both streams and leave everything else intact', () => {
				const input = buildSDP(untaggedOfferLines);
				const output = SDP.mutateSDPWithStreamContents(input, [
					{ id: 'main-stream', content: 'main' },
					{ id: 'screen-stream', content: 'slides' },
				]);

				expect(SDP.getStreamContentMapFromSDP(output)).toEqual({
					'main-stream': 'main',
					'screen-stream': 'slides',
				});
				// Exactly one tag added per media, none duplicated.
				expect(output.match(/a=content:/g)).toHaveLength(2);
				// Every original line survives the mutation, only content lines are new.
				const addedLines = output.split(CRLF).filter((line) => line && !untaggedOfferLines.includes(line));
				expect(addedLines).toEqual(['a=content:main', 'a=content:slides']);
			});

			it('should append the content tag inside the media section that owns the stream', () => {
				const output = SDP.mutateSDPWithStreamContents(buildSDP(untaggedOfferLines), [{ id: 'screen-stream', content: 'slides' }]);
				const parsed = new SDP(output);

				expect(parsed.medias[0].type).toBe('audio');
				expect(parsed.medias[0].content).toBeNull();
				expect(parsed.medias[1].type).toBe('video');
				expect(parsed.medias[1].content).toBe('slides');
				// The tag lands in the video block, not the audio block or the header.
				expect(parsed.medias[1].lines).toContain('a=content:slides');
				expect(parsed.medias[0].lines).not.toContain('a=content:slides');
			});

			it('should only tag the requested stream and leave the other untagged', () => {
				const output = SDP.mutateSDPWithStreamContents(buildSDP(untaggedOfferLines), [{ id: 'main-stream', content: 'main' }]);
				expect(SDP.getStreamContentMapFromSDP(output)).toEqual({ 'main-stream': 'main' });
				expect(output.match(/a=content:/g)).toHaveLength(1);
			});

			it.each([
				['CRLF', CRLF],
				['LF', '\n'],
			])('should tag a %s-delimited offer and serialize with CRLF', (_label, delimiter) => {
				const output = SDP.mutateSDPWithStreamContents(buildSDP(untaggedOfferLines, delimiter), [
					{ id: 'main-stream', content: 'main' },
					{ id: 'screen-stream', content: 'slides' },
				]);

				expect(output).toContain(`a=content:main${CRLF}`);
				expect(output).toContain(`a=content:slides${CRLF}`);
				expect(SDP.getStreamContentMapFromSDP(output)).toEqual({
					'main-stream': 'main',
					'screen-stream': 'slides',
				});
			});
		});
	});

	describe('getStreamContentMapFromSDP', () => {
		it('should map stream ids to their content tag', () => {
			expect(SDP.getStreamContentMapFromSDP(sampleSDP)).toEqual({ 'video-stream': 'slides' });
		});

		it('should skip media without a content tag', () => {
			const sdp = buildSDP([...headerLines, ...audioMediaLines]);
			expect(SDP.getStreamContentMapFromSDP(sdp)).toEqual({});
		});

		it('should map every stream id of a media sharing the same content', () => {
			const sdp = buildSDP([
				...headerLines,
				'm=video 9 UDP/TLS/RTP/SAVPF 96',
				'a=msid:stream-a track-a',
				'a=msid:stream-b track-b',
				'a=content:slides',
			]);
			expect(SDP.getStreamContentMapFromSDP(sdp)).toEqual({
				'stream-a': 'slides',
				'stream-b': 'slides',
			});
		});
	});

	describe('getStreamTagByMediaContent', () => {
		it('should map "slides" to "screen-share"', () => {
			expect(SDP.getStreamTagByMediaContent('slides')).toBe('screen-share');
		});

		it('should map "main" to "main"', () => {
			expect(SDP.getStreamTagByMediaContent('main')).toBe('main');
		});

		it.each(['speaker', 'sl', 'alt', 'unknown', ''])('should return null for %p', (content) => {
			expect(SDP.getStreamTagByMediaContent(content)).toBeNull();
		});
	});

	describe('main/slides screen-share SDP', () => {
		it('should parse the audio-only main stream and the slides video stream', () => {
			const sdp = new SDP(buildSDP(screenShareMediaLines));

			expect(sdp.medias[0].type).toBe('audio');
			expect(sdp.medias[0].content).toBe('main');
			expect(sdp.medias[0].streamIds).toEqual(['main-stream']);

			expect(sdp.medias[1].type).toBe('video');
			expect(sdp.medias[1].content).toBe('slides');
			expect(sdp.medias[1].streamIds).toEqual(['screen-stream']);
		});

		it.each([
			['CRLF', CRLF],
			['LF', '\n'],
		])('should read existing main and slides content tags from %s input', (_label, delimiter) => {
			const sdp = buildSDP(screenShareMediaLines, delimiter);
			expect(SDP.getStreamContentMapFromSDP(sdp)).toEqual({
				'main-stream': 'main',
				'screen-stream': 'slides',
			});
		});

		it.each([
			['CRLF', CRLF],
			['LF', '\n'],
		])('should preserve the exact content tags when round-tripping %s input', (_label, delimiter) => {
			const sdp = new SDP(buildSDP(screenShareMediaLines, delimiter));
			const output = sdp.joinLines();
			expect(output).toContain(`a=content:main${CRLF}`);
			expect(output).toContain(`a=content:slides${CRLF}`);
			expect(output.match(/a=content:/g)).toHaveLength(2);
		});

		it('should replace an existing tag in place without leaving a stale one', () => {
			const output = SDP.mutateSDPWithStreamContents(buildSDP(screenShareMediaLines), [{ id: 'main-stream', content: 'slides' }]);

			// The main section flips main -> slides; the screen-share section is untouched.
			expect(SDP.getStreamContentMapFromSDP(output)).toEqual({
				'main-stream': 'slides',
				'screen-stream': 'slides',
			});
			// No stale `main` tag left behind after replacement.
			expect(output).not.toContain('a=content:main');
			expect(output.match(/a=content:/g)).toHaveLength(2);
		});

		it('should place tags only on the media owning each stream id', () => {
			const sdp = new SDP(buildSDP(screenShareMediaLines));
			sdp.setContentMediaByStreamId('screen-stream', 'speaker');

			expect(sdp.medias[0].content).toBe('main');
			expect(sdp.medias[1].content).toBe('speaker');
		});

		it('should handle a main stream carrying a camera video track', () => {
			const sdp = new SDP(buildSDP(screenShareWithCameraMediaLines));

			expect(sdp.medias[0].type).toBe('video');
			expect(sdp.medias[0].content).toBe('main');
			expect(SDP.getStreamContentMapFromSDP(buildSDP(screenShareWithCameraMediaLines))).toEqual({
				'main-stream': 'main',
				'screen-stream': 'slides',
			});
		});
	});
});
