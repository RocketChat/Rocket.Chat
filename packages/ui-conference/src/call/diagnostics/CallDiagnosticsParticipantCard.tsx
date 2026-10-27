import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import CallDiagnosticsStatRow from './CallDiagnosticsStatRow';
import { fmt, fmtKbps } from './format';
import type { ParticipantTrackStats } from '../context';

const CallDiagnosticsParticipantCard = ({ participant }: { participant: ParticipantTrackStats }) => {
	const { t } = useTranslation();

	return (
		<Box paddingBlock={8} paddingInline={12} borderRadius='large' backgroundColor='surface-hover' marginBlockEnd={8}>
			<Box fontScale='p2b' marginBlockEnd={4}>
				{participant.displayName}
			</Box>
			<CallDiagnosticsStatRow
				label={t('Resolution')}
				value={participant.videoWidth && participant.videoHeight ? `${participant.videoWidth}x${participant.videoHeight}` : '—'}
			/>
			<CallDiagnosticsStatRow label={t('Codec')} value={participant.videoCodec ?? '—'} />
			<CallDiagnosticsStatRow label={t('FPS')} value={participant.fps != null ? Math.round(participant.fps) : '—'} />
			<CallDiagnosticsStatRow label={t('Video_bitrate')} value={fmtKbps(participant.videoBitrateKbps)} />
			<CallDiagnosticsStatRow label={t('Audio_bitrate')} value={fmtKbps(participant.audioBitrateKbps)} />
			<CallDiagnosticsStatRow label={t('Packets_lost')} value={participant.packetsLost ?? '—'} />
			<CallDiagnosticsStatRow label={t('Jitter')} value={fmt(participant.jitterMs, 'ms')} />
		</Box>
	);
};

export default CallDiagnosticsParticipantCard;
