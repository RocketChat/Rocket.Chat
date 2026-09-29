import { css } from '@rocket.chat/css-in-js';
import { Box, Divider, Palette } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import CallDiagnosticsParticipantCard from './CallDiagnosticsParticipantCard';
import CallDiagnosticsStatRow from './CallDiagnosticsStatRow';
import CallPanelHeader from '../../components/CallPanelHeader';
import { useCallDiagnostics } from '../context';

export type CallDiagnosticsPanelProps = {
	onClose: () => void;
};

const labelStyles = css`
	text-transform: uppercase;
	letter-spacing: 0.03125rem;
`;

const QUALITY_COLORS: Record<string, string> = {
	excellent: Palette.statusColor['status-font-on-success'].toString(),
	good: Palette.statusColor['status-font-on-success'].toString(),
	poor: Palette.statusColor['status-font-on-warning'].toString(),
	lost: Palette.text['font-danger'].toString(),
};

const qualityDotStyles = (quality: string) => css`
	display: inline-block;
	width: 0.5rem;
	height: 0.5rem;
	border-radius: 50%;
	background: ${QUALITY_COLORS[quality.toLowerCase()] ?? Palette.text['font-secondary-info'].toString()};
`;

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

/** How the connection of the call running in this window is doing, sampled by its provider. */
const CallDiagnosticsPanel = ({ onClose }: CallDiagnosticsPanelProps) => {
	const { t } = useTranslation();
	const diagnostics = useCallDiagnostics();

	return (
		<>
			<CallPanelHeader title={t('Connection_info')} onClose={onClose} />
			<Box flexGrow={1} overflowY='auto'>
				{!diagnostics ? (
					<Box paddingBlock={8} paddingInline={16} color='font-secondary-info' fontStyle='italic'>
						{t('Waiting_for_data')}
					</Box>
				) : (
					<>
						<Box paddingBlock={8} paddingInline={16}>
							<Box className={labelStyles} fontScale='c2' color='font-secondary-info' marginBlockEnd={8}>
								{t('Connection')}
							</Box>
							<CallDiagnosticsStatRow label={t('Server')} value={diagnostics.serverUrl.replace(/^wss?:\/\//, '')} />
							<CallDiagnosticsStatRow label={t('Status')} value={diagnostics.connectionState} />
							<CallDiagnosticsStatRow
								label={t('Quality')}
								value={
									<Box display='inline-flex' alignItems='center'>
										<Box className={qualityDotStyles(diagnostics.connectionQuality)} is='span' marginInlineEnd={8} />
										{diagnostics.connectionQuality}
									</Box>
								}
							/>
							<CallDiagnosticsStatRow label={t('Latency')} value={fmt(diagnostics.roundTripTimeMs, 'ms')} />
						</Box>

						<Divider />

						<Box paddingBlock={8} paddingInline={16}>
							<Box className={labelStyles} fontScale='c2' color='font-secondary-info' marginBlockEnd={8}>
								{t('Bandwidth')}
							</Box>
							<CallDiagnosticsStatRow label={t('Upload')} value={fmtKbps(diagnostics.uploadKbps)} />
							<CallDiagnosticsStatRow label={t('Download')} value={fmtKbps(diagnostics.downloadKbps)} />
							<CallDiagnosticsStatRow label={t('Total_sent')} value={formatBytes(diagnostics.totalBytesSent)} />
							<CallDiagnosticsStatRow label={t('Total_received')} value={formatBytes(diagnostics.totalBytesReceived)} />
						</Box>

						<Divider />

						<Box paddingBlock={8} paddingInline={16}>
							<Box className={labelStyles} fontScale='c2' color='font-secondary-info' marginBlockEnd={8}>
								{t('Video_sending')}
							</Box>
							<CallDiagnosticsStatRow
								label={t('Resolution')}
								value={
									diagnostics.sendWidth && diagnostics.sendHeight ? `${diagnostics.sendWidth}x${diagnostics.sendHeight}` : t('Camera_off')
								}
							/>
							<CallDiagnosticsStatRow label={t('Codec')} value={diagnostics.sendCodec ?? '—'} />
							<CallDiagnosticsStatRow label={t('FPS')} value={diagnostics.sendFps ?? '—'} />
							<CallDiagnosticsStatRow label={t('Limited_by')} value={diagnostics.qualityLimitationReason || t('None')} />
						</Box>

						{diagnostics.backgroundBlur && (
							<>
								<Divider />
								<Box paddingBlock={8} paddingInline={16}>
									<Box className={labelStyles} fontScale='c2' color='font-secondary-info' marginBlockEnd={8}>
										{t('Background_blur')}
									</Box>
									<CallDiagnosticsStatRow label={t('Background_blur_processor_fps')} value={fmtDecimal(diagnostics.backgroundBlur.fps)} />
									<CallDiagnosticsStatRow
										label={t('Background_blur_frame_time')}
										value={fmtDecimal(diagnostics.backgroundBlur.frameMs, ' ms')}
									/>
									<CallDiagnosticsStatRow
										label={t('Background_blur_compositor_time')}
										value={fmtDecimal(diagnostics.backgroundBlur.compositorMs, ' ms')}
									/>
									<CallDiagnosticsStatRow
										label={t('Background_blur_segmentation_time')}
										value={fmtDecimal(diagnostics.backgroundBlur.segmentationMs, ' ms')}
									/>
									<CallDiagnosticsStatRow
										label={t('Background_blur_mask_interval')}
										value={fmt(diagnostics.backgroundBlur.segmentIntervalMs, 'ms')}
									/>
									<CallDiagnosticsStatRow label={t('Background_blur_adaptive_level')} value={diagnostics.backgroundBlur.qualityReduction} />
								</Box>
							</>
						)}

						{diagnostics.participants.length > 0 && (
							<>
								<Divider />
								<Box paddingBlock={8} paddingInline={16}>
									<Box className={labelStyles} fontScale='c2' color='font-secondary-info' marginBlockEnd={8}>
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
