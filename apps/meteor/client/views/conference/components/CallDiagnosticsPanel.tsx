import { css } from '@rocket.chat/css-in-js';
import { Box, Divider } from '@rocket.chat/fuselage';
import type { CallDiagnosticsData } from '@rocket.chat/ui-voip';
import { useTranslation } from 'react-i18next';

import CallDiagnosticsParticipantCard from './CallDiagnosticsParticipantCard';
import CallDiagnosticsStatRow from './CallDiagnosticsStatRow';
import CallPanelHeader from './CallPanelHeader';

type CallDiagnosticsPanelProps = {
	// ui-voip's source type carries this field. Keep the intersection while Meteor typechecks against a previously
	// built workspace-package declaration, which can lag behind that source until the package is rebuilt.
	diagnostics?: CallDiagnosticsData & {
		backgroundBlur?: {
			fps?: number;
			frameMs?: number;
			compositorMs?: number;
			segmentationMs?: number;
			segmentIntervalMs: number;
			qualityReduction: 0 | 1 | 2;
		};
	};
	onClose: () => void;
};

const sectionStyles = css`
	padding-block: 8px;
	padding-inline: 16px;
`;

const labelStyles = css`
	font-size: 12px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: var(--rcx-color-font-secondary-info);
	margin-block-end: 8px;
`;

const qualityDotStyles = (quality: string) => {
	const colors: Record<string, string> = {
		excellent: '#2de0a5',
		good: '#2de0a5',
		poor: '#f5a623',
		lost: '#f44336',
	};
	return css`
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: ${colors[quality.toLowerCase()] || 'var(--rcx-color-font-secondary-info)'};
		margin-inline-end: 6px;
	`;
};

const formatBytes = (bytes?: number): string => {
	if (bytes == null) {
		return '—';
	}
	if (bytes < 1024) {
		return `${bytes} B`;
	}
	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`;
	}
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fmt = (value: number | undefined, suffix: string): string => (value != null ? `${value} ${suffix}` : '—');
const fmtDecimal = (value: number | undefined, suffix = ''): string => (value != null ? `${Math.round(value * 10) / 10}${suffix}` : '—');
const fmtKbps = (value: number | undefined): string => (value != null ? `${Math.round(value / 10) * 10} kbps` : '—');

const CallDiagnosticsPanel = ({ diagnostics, onClose }: CallDiagnosticsPanelProps) => {
	const { t } = useTranslation();

	return (
		<>
			<CallPanelHeader title={t('Connection_info')} onClose={onClose} />
			<Box flexGrow={1} overflowY='auto'>
				{!diagnostics ? (
					<Box className={sectionStyles} color='font-secondary-info' fontStyle='italic'>
						{t('Waiting_for_data')}
					</Box>
				) : (
					<>
						<Box className={sectionStyles}>
							<Box className={labelStyles}>{t('Connection')}</Box>
							<CallDiagnosticsStatRow label={t('Server')} value={diagnostics.serverUrl.replace(/^wss?:\/\//, '')} />
							<CallDiagnosticsStatRow label={t('Status')} value={diagnostics.connectionState} />
							<CallDiagnosticsStatRow
								label={t('Quality')}
								value={
									<Box display='inline-flex' alignItems='center'>
										<Box className={qualityDotStyles(diagnostics.connectionQuality)} is='span' />
										{diagnostics.connectionQuality}
									</Box>
								}
							/>
							<CallDiagnosticsStatRow label={t('Latency')} value={fmt(diagnostics.roundTripTimeMs, 'ms')} />
						</Box>

						<Divider />

						<Box className={sectionStyles}>
							<Box className={labelStyles}>{t('Bandwidth')}</Box>
							<CallDiagnosticsStatRow label={t('Upload')} value={fmtKbps(diagnostics.uploadKbps)} />
							<CallDiagnosticsStatRow label={t('Download')} value={fmtKbps(diagnostics.downloadKbps)} />
							<CallDiagnosticsStatRow label={t('Total_sent')} value={formatBytes(diagnostics.totalBytesSent)} />
							<CallDiagnosticsStatRow label={t('Total_received')} value={formatBytes(diagnostics.totalBytesReceived)} />
						</Box>

						<Divider />

						<Box className={sectionStyles}>
							<Box className={labelStyles}>{t('Video_sending')}</Box>
							<CallDiagnosticsStatRow
								label={t('Resolution')}
								value={
									diagnostics.sendWidth && diagnostics.sendHeight ? `${diagnostics.sendWidth}x${diagnostics.sendHeight}` : t('Camera_off')
								}
							/>
							<CallDiagnosticsStatRow label={t('Codec')} value={diagnostics.sendCodec ?? '—'} />
							<CallDiagnosticsStatRow label='FPS' value={diagnostics.sendFps ?? '—'} />
							<CallDiagnosticsStatRow label={t('Limited_by')} value={diagnostics.qualityLimitationReason || 'none'} />
						</Box>

						{diagnostics.backgroundBlur && (
							<>
								<Divider />
								<Box className={sectionStyles}>
									<Box className={labelStyles}>Background blur</Box>
									<CallDiagnosticsStatRow label='Processor FPS' value={fmtDecimal(diagnostics.backgroundBlur.fps)} />
									<CallDiagnosticsStatRow label='Frame work' value={fmtDecimal(diagnostics.backgroundBlur.frameMs, ' ms')} />
									<CallDiagnosticsStatRow label='Compositor' value={fmtDecimal(diagnostics.backgroundBlur.compositorMs, ' ms')} />
									<CallDiagnosticsStatRow label='Segmentation' value={fmtDecimal(diagnostics.backgroundBlur.segmentationMs, ' ms')} />
									<CallDiagnosticsStatRow label='Mask interval' value={fmt(diagnostics.backgroundBlur.segmentIntervalMs, 'ms')} />
									<CallDiagnosticsStatRow label='Adaptive level' value={diagnostics.backgroundBlur.qualityReduction} />
								</Box>
							</>
						)}

						{diagnostics.participants.length > 0 && (
							<>
								<Divider />
								<Box className={sectionStyles}>
									<Box className={labelStyles}>
										{t('Receiving')} ({diagnostics.participants.length})
									</Box>
									{diagnostics.participants.map((p) => (
										<CallDiagnosticsParticipantCard key={p.id} participant={p} />
									))}
								</Box>
							</>
						)}
					</>
				)}
			</Box>
		</>
	);
};

export default CallDiagnosticsPanel;
