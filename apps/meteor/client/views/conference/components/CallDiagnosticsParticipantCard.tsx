import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ParticipantTrackStats } from '@rocket.chat/ui-voip';

import CallDiagnosticsStatRow from './CallDiagnosticsStatRow';

const participantCardStyles = css`
	padding: 8px 12px;
	border-radius: 8px;
	background: var(--rcx-color-surface-hover);
	margin-block-end: 8px;
`;

const fmt = (value: number | undefined, suffix: string): string => (value != null ? `${value} ${suffix}` : '—');
const fmtKbps = (value: number | undefined): string => (value != null ? `${Math.round(value / 10) * 10} kbps` : '—');

const CallDiagnosticsParticipantCard = ({ participant }: { participant: ParticipantTrackStats }) => (
	<Box className={participantCardStyles}>
		<Box fontScale='p2b' style={{ marginBlockEnd: 4 }}>
			{participant.displayName}
		</Box>
		<CallDiagnosticsStatRow
			label='Resolution'
			value={participant.videoWidth && participant.videoHeight ? `${participant.videoWidth}x${participant.videoHeight}` : '—'}
		/>
		<CallDiagnosticsStatRow label='Codec' value={participant.videoCodec ?? '—'} />
		<CallDiagnosticsStatRow label='FPS' value={participant.fps != null ? Math.round(participant.fps) : '—'} />
		<CallDiagnosticsStatRow label='Video bitrate' value={fmtKbps(participant.videoBitrateKbps)} />
		<CallDiagnosticsStatRow label='Audio bitrate' value={fmtKbps(participant.audioBitrateKbps)} />
		<CallDiagnosticsStatRow label='Packets lost' value={participant.packetsLost ?? 0} />
		<CallDiagnosticsStatRow label='Jitter' value={fmt(participant.jitterMs, 'ms')} />
	</Box>
);

export default CallDiagnosticsParticipantCard;
