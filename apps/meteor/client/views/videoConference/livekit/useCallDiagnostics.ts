import type { LocalAudioTrack, LocalVideoTrack, Participant, LocalTrack, RemoteTrack } from 'livekit-client';
import { Track } from 'livekit-client';
import { useEffect, useRef, useState } from 'react';

const POLL_MS = 2000;

export type ParticipantTrackStats = {
	id: string;
	displayName: string;
	videoWidth?: number;
	videoHeight?: number;
	videoCodec?: string;
	fps?: number;
	videoBitrateKbps?: number;
	audioBitrateKbps?: number;
	packetsLost?: number;
	jitterMs?: number;
};

export type CallDiagnosticsData = {
	serverUrl: string;
	connectionState: string;
	connectionQuality: string;
	roundTripTimeMs?: number;
	/** Local upload bitrate in kbps (audio + video). */
	uploadKbps?: number;
	/** Total download bitrate in kbps (audio + video). */
	downloadKbps?: number;
	/** Total bytes sent since call start. */
	totalBytesSent?: number;
	/** Total bytes received since call start. */
	totalBytesReceived?: number;
	/** Local video send resolution. */
	sendWidth?: number;
	sendHeight?: number;
	sendFps?: number;
	sendCodec?: string;
	/** Why the encoder is limiting quality. */
	qualityLimitationReason?: string;
	/** Measured local blur-pipeline stages, when the WebGL processor is attached. */
	backgroundBlur?: {
		fps?: number;
		frameMs?: number;
		compositorMs?: number;
		segmentationMs?: number;
		segmentIntervalMs: number;
		qualityReduction: 0 | 1 | 2;
	};
	/** Per-remote-participant receive stats. */
	participants: ParticipantTrackStats[];
	/** Audio packets concealed (gaps filled by the decoder). */
	audioConcealment?: number;
	/** Timestamp of last stats read. */
	timestamp: number;
};

type PrevSnapshot = {
	timestamp: number;
	bytesSent: number;
	bytesReceived: number;
	perParticipant: Map<string, { videoBytes: number; audioBytes: number }>;
};

async function readLocalVideoStats(localParticipant: Participant): Promise<{
	width?: number;
	height?: number;
	fps?: number;
	codec?: string;
	qualityLimitationReason?: string;
	bytesSent: number;
	rtt?: number;
	backgroundBlur?: CallDiagnosticsData['backgroundBlur'];
}> {
	const pub = localParticipant.getTrackPublication(Track.Source.Camera);
	const track = pub?.track as LocalVideoTrack | undefined;
	if (!track) {
		return { bytesSent: 0 };
	}

	const stats = await track.getRTCStatsReport();
	if (!stats) {
		return { bytesSent: 0 };
	}

	let best: { width: number; height: number; fps?: number; bytesSent: number } | undefined;
	let codec: string | undefined;
	let qualityLimitationReason: string | undefined;
	let rtt: number | undefined;
	let totalBytesSent = 0;
	const processor = track.getProcessor() as { getPerformanceStats?: () => NonNullable<CallDiagnosticsData['backgroundBlur']> } | undefined;
	const backgroundBlur = processor?.getPerformanceStats?.();

	stats.forEach((report) => {
		if (report.type === 'outbound-rtp' && report.kind === 'video') {
			const { frameWidth: w, frameHeight: h, framesPerSecond: fps, bytesSent: bs } = report;
			totalBytesSent += bs || 0;
			if (w && h && (!best || h > best.height)) {
				best = { width: w, height: h, fps, bytesSent: bs || 0 };
			}
			if (report.codecId) {
				const codecReport = stats.get(report.codecId);
				if (codecReport) {
					codec = codecReport.mimeType?.replace('video/', '');
				}
			}
			qualityLimitationReason = report.qualityLimitationReason;
		}
		if (report.type === 'candidate-pair' && report.state === 'succeeded') {
			rtt = report.currentRoundTripTime != null ? report.currentRoundTripTime * 1000 : undefined;
		}
	});

	return {
		width: best?.width,
		height: best?.height,
		fps: best?.fps,
		codec,
		qualityLimitationReason,
		bytesSent: totalBytesSent,
		rtt,
		backgroundBlur,
	};
}

async function readLocalAudioStats(localParticipant: Participant): Promise<{ bytesSent: number }> {
	const pub = localParticipant.getTrackPublication(Track.Source.Microphone);
	const track = pub?.track as LocalAudioTrack | undefined;
	if (!track) {
		return { bytesSent: 0 };
	}

	const stats = await track.getRTCStatsReport();
	if (!stats) {
		return { bytesSent: 0 };
	}

	let bytesSent = 0;
	stats.forEach((report) => {
		if (report.type === 'outbound-rtp' && report.kind === 'audio') {
			bytesSent += report.bytesSent || 0;
		}
	});

	return { bytesSent };
}

async function readRemoteParticipantStats(participant: Participant): Promise<{
	videoWidth?: number;
	videoHeight?: number;
	videoCodec?: string;
	fps?: number;
	videoBytes: number;
	audioBytes: number;
	packetsLost?: number;
	jitterMs?: number;
	concealedSamples?: number;
}> {
	const allReports: { report: any; stats: RTCStatsReport }[] = [];

	for (const pub of participant.trackPublications.values()) {
		if (!pub.track) {
			continue;
		}

		const track = pub.track as LocalTrack | RemoteTrack;
		if (!('getRTCStatsReport' in track)) {
			continue;
		}
		const rtcStats = await track.getRTCStatsReport();
		if (!rtcStats) {
			continue;
		}

		rtcStats.forEach((report: any) => {
			allReports.push({ report, stats: rtcStats });
		});
	}

	let videoWidth: number | undefined;
	let videoHeight: number | undefined;
	let videoCodec: string | undefined;
	let fps: number | undefined;
	let videoBytes = 0;
	let audioBytes = 0;
	let packetsLost: number | undefined;
	let jitterMs: number | undefined;
	let concealedSamples: number | undefined;

	for (const { report, stats } of allReports) {
		if (report.type === 'inbound-rtp' && report.kind === 'video') {
			if (report.frameWidth && report.frameHeight) {
				videoWidth = report.frameWidth;
				videoHeight = report.frameHeight;
			}
			fps = report.framesPerSecond;
			videoBytes += report.bytesReceived || 0;
			if (report.packetsLost != null) {
				packetsLost = (packetsLost ?? 0) + report.packetsLost;
			}
			if (report.codecId) {
				const codecReport = stats.get(report.codecId);
				if (codecReport) {
					videoCodec = codecReport.mimeType?.replace('video/', '');
				}
			}
		}
		if (report.type === 'inbound-rtp' && report.kind === 'audio') {
			audioBytes += report.bytesReceived || 0;
			if (report.jitter != null) {
				jitterMs = report.jitter * 1000;
			}
			if (report.concealedSamples != null) {
				concealedSamples = (concealedSamples ?? 0) + report.concealedSamples;
			}
		}
	}

	return { videoWidth, videoHeight, videoCodec, fps, videoBytes, audioBytes, packetsLost, jitterMs, concealedSamples };
}

export const useCallDiagnostics = (
	room: { state: string; localParticipant: Participant },
	remoteParticipants: Participant[],
	serverUrl: string,
): CallDiagnosticsData | undefined => {
	const [diagnostics, setDiagnostics] = useState<CallDiagnosticsData | undefined>();
	const prev = useRef<PrevSnapshot | null>(null);

	const roomRef = useRef(room);
	roomRef.current = room;
	const remoteRef = useRef(remoteParticipants);
	remoteRef.current = remoteParticipants;
	const serverUrlRef = useRef(serverUrl);
	serverUrlRef.current = serverUrl;

	useEffect(() => {
		let cancelled = false;

		const read = async () => {
			try {
				const now = Date.now();
				const currentRoom = roomRef.current;
				const currentRemotes = remoteRef.current;
				const currentServerUrl = serverUrlRef.current;
				const localP = currentRoom.localParticipant;

				const [videoStats, audioStats, ...remoteStats] = await Promise.all([
					readLocalVideoStats(localP),
					readLocalAudioStats(localP),
					...currentRemotes.map((p) => readRemoteParticipantStats(p)),
				]);

				const totalBytesSent = videoStats.bytesSent + audioStats.bytesSent;
				let totalBytesReceived = 0;
				const perParticipant = new Map<string, { videoBytes: number; audioBytes: number }>();

				const participantStats: ParticipantTrackStats[] = currentRemotes.map((p, i) => {
					const rs = remoteStats[i];
					totalBytesReceived += rs.videoBytes + rs.audioBytes;
					perParticipant.set(p.identity, { videoBytes: rs.videoBytes, audioBytes: rs.audioBytes });

					let videoBitrateKbps: number | undefined;
					let audioBitrateKbps: number | undefined;
					if (prev.current) {
						const prevP = prev.current.perParticipant.get(p.identity);
						if (prevP) {
							const dt = (now - prev.current.timestamp) / 1000;
							if (dt > 0) {
								videoBitrateKbps = Math.max(0, Math.round(((rs.videoBytes - prevP.videoBytes) * 8) / dt / 1000));
								audioBitrateKbps = Math.max(0, Math.round(((rs.audioBytes - prevP.audioBytes) * 8) / dt / 1000));
							}
						}
					}

					return {
						id: p.identity,
						displayName: p.name || p.identity,
						videoWidth: rs.videoWidth,
						videoHeight: rs.videoHeight,
						videoCodec: rs.videoCodec,
						fps: rs.fps != null ? Math.round(rs.fps) : undefined,
						videoBitrateKbps,
						audioBitrateKbps,
						packetsLost: rs.packetsLost,
						jitterMs: rs.jitterMs != null ? Math.round(rs.jitterMs * 10) / 10 : undefined,
					};
				});

				let uploadKbps: number | undefined;
				let downloadKbps: number | undefined;
				if (prev.current) {
					const dt = (now - prev.current.timestamp) / 1000;
					if (dt > 0) {
						uploadKbps = Math.max(0, Math.round(((totalBytesSent - prev.current.bytesSent) * 8) / dt / 1000));
						downloadKbps = Math.max(0, Math.round(((totalBytesReceived - prev.current.bytesReceived) * 8) / dt / 1000));
					}
				}

				let audioConcealment: number | undefined;
				for (const rs of remoteStats) {
					if (rs.concealedSamples != null) {
						audioConcealment = (audioConcealment ?? 0) + rs.concealedSamples;
					}
				}

				prev.current = { timestamp: now, bytesSent: totalBytesSent, bytesReceived: totalBytesReceived, perParticipant };

				if (cancelled) {
					return;
				}

				setDiagnostics({
					serverUrl: currentServerUrl,
					connectionState: currentRoom.state,
					connectionQuality: localP.connectionQuality ?? 'unknown',
					roundTripTimeMs: videoStats.rtt != null ? Math.round(videoStats.rtt) : undefined,
					uploadKbps,
					downloadKbps,
					totalBytesSent,
					totalBytesReceived,
					sendWidth: videoStats.width,
					sendHeight: videoStats.height,
					sendFps: videoStats.fps != null ? Math.round(videoStats.fps) : undefined,
					sendCodec: videoStats.codec,
					qualityLimitationReason: videoStats.qualityLimitationReason,
					backgroundBlur: videoStats.backgroundBlur,
					participants: participantStats,
					audioConcealment,
					timestamp: now,
				});
			} catch {
				// Stats are best-effort.
			}
		};

		void read();
		const timer = setInterval(() => void read(), POLL_MS);

		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, []);

	return diagnostics;
};
