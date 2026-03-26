import type { AudioAttachmentProps } from '@rocket.chat/core-typings';
import { AudioPlayer, Box, Button, Icon, IconButton } from '@rocket.chat/fuselage';
import { useMediaUrl } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useReloadOnError } from './hooks/useReloadOnError';
import { useTranscribeAudio } from './hooks/useTranscribeAudio';
import MarkdownText from '../../../../MarkdownText';
import MessageCollapsible from '../../../MessageCollapsible';
import MessageContentBody from '../../../MessageContentBody';

const LANGUAGES = [
	{ code: '', label: 'Auto-detect' },
	{ code: 'en', label: 'English' },
	{ code: 'pt', label: 'Português' },
] as const;

const MODELS = [
	{ id: 'onnx-community/whisper-tiny', label: 'Tiny (~40 MB)', shortLabel: 'Tiny' },
	{ id: 'onnx-community/whisper-small', label: 'Small (~150 MB)', shortLabel: 'Small' },
] as const;

const AudioAttachment = ({
	title,
	audio_url: url,
	audio_type: type,
	audio_size: size,
	description,
	descriptionMd,
	title_link: link,
	title_link_download: hasDownload,
	collapsed,
}: AudioAttachmentProps) => {
	const { t } = useTranslation();
	const getURL = useMediaUrl();
	const src = useMemo(() => getURL(url), [getURL, url]);
	const { mediaRef } = useReloadOnError(src, 'audio');
	const { transcribe, unloadModel, modelLoaded, status, transcript, progress, metrics, isSupported } = useTranscribeAudio();
	const [language, setLanguage] = useState<string>('');
	const [modelId, setModelId] = useState<string>('onnx-community/whisper-small');
	const [showMetrics, setShowMetrics] = useState(true);
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const handleTranscribe = useCallback(() => {
		if (status === 'idle' || status === 'error' || status === 'done') {
			setMenuOpen(false);
			transcribe(src, language || undefined, modelId);
		}
	}, [status, transcribe, src, language, modelId]);

	const isLoading = status === 'loading-model' || status === 'transcribing';

	const buttonLabel = () => {
		if (status === 'loading-model') return progress ? `${t('Downloading_model')} ${progress}` : t('Downloading_model');
		if (status === 'transcribing') return t('Transcribing');
		return t('Transcribe');
	};

	const selectedLang = LANGUAGES.find((l) => l.code === language)?.label || 'Auto-detect';
	const selectedModel = MODELS.find((m) => m.id === modelId)?.shortLabel || 'Small';

	return (
		<>
			{descriptionMd ? <MessageContentBody md={descriptionMd} /> : <MarkdownText parseEmoji content={description} />}
			<MessageCollapsible title={title} hasDownload={hasDownload} link={getURL(link || url)} size={size} isCollapsed={collapsed}>
				<AudioPlayer src={src} type={type} ref={mediaRef} />
				{isSupported && (
					<Box mbs={4} display='flex' alignItems='center' position='relative' ref={menuRef} style={{ overflow: 'visible' }}>
						<Button small onClick={handleTranscribe} disabled={isLoading}>
							<Icon name='language' size='x16' mie={4} />
							{buttonLabel()}
						</Button>
						{!isLoading && (
							<>
								<IconButton
									small
									icon='chevron-down'
									mis={2}
									onClick={() => setMenuOpen(!menuOpen)}
									title={`${selectedLang} · ${selectedModel}`}
								/>
								{menuOpen && (
									<Box
										position='absolute'
										zIndex={100}
										bg='surface-sidebar'
										elevation='2'
										borderRadius={4}
										borderWidth={1}
										borderColor='stroke-extra-light'
										p={4}
										style={{ bottom: '100%', left: 0, marginBottom: 4, minWidth: 180 }}
									>
										<Box fontScale='c2' color='hint' pbs={4} pbe={2} pie={4} pis={28}>
											{t('Language')}
										</Box>
										{LANGUAGES.map((lang) => (
											<Box
												key={lang.code}
												display='flex'
												alignItems='center'
												p={4}
												borderRadius={4}
												color={language === lang.code ? 'font-info' : 'default'}
												bg={language === lang.code ? 'surface-selected' : undefined}
												style={{ cursor: 'pointer' }}
												onClick={() => {
													setLanguage(lang.code);
												}}
											>
												<Box mie={8} fontScale='c1' style={{ width: 16 }}>
													{language === lang.code ? '✓' : ''}
												</Box>
												<Box fontScale='p2'>{lang.label}</Box>
											</Box>
										))}
										<Box fontScale='c2' color='hint' pbs={8} pbe={2} pie={4} pis={28}>
											{t('Model')}
										</Box>
										{MODELS.map((model) => (
											<Box
												key={model.id}
												display='flex'
												alignItems='center'
												p={4}
												borderRadius={4}
												color={modelId === model.id ? 'font-info' : 'default'}
												bg={modelId === model.id ? 'surface-selected' : undefined}
												style={{ cursor: 'pointer' }}
												onClick={() => {
													setModelId(model.id);
												}}
											>
												<Box mie={8} fontScale='c1' style={{ width: 16 }}>
													{modelId === model.id ? '✓' : ''}
												</Box>
												<Box fontScale='p2'>{model.label}</Box>
											</Box>
										))}
										<Box borderBlockStartWidth={1} borderColor='stroke-extra-light' mbs={4} pbs={4}>
											<Box
												display='flex'
												alignItems='center'
												p={4}
												borderRadius={4}
												style={{ cursor: 'pointer' }}
												onClick={() => setShowMetrics(!showMetrics)}
											>
												<Box mie={8} fontScale='c1' style={{ width: 16 }}>
													{showMetrics ? '✓' : ''}
												</Box>
												<Box fontScale='p2'>{t('Show_metrics')}</Box>
											</Box>
										</Box>
									</Box>
								)}
							</>
						)}
					</Box>
				)}
			</MessageCollapsible>
			{status === 'done' && transcript && (
				<Box mbs={4}>
					<Box
						p={8}
						bg='surface-tint'
						borderRadius={4}
						fontScale='p2'
						color='default'
					>
						{transcript}
					</Box>
					{metrics && showMetrics && (
						<Box mbs={4} p={6} bg='surface-neutral' borderRadius={4} fontScale='micro' color='hint'>
							<Box display='flex' flexWrap='wrap' mbe={2}>
								<Box mie={16} fontWeight={700}>Inference: {(metrics.inferenceTime / 1000).toFixed(2)}s</Box>
								<Box mie={16}>RT factor: {metrics.realtimeFactor}x</Box>
								<Box mie={16}>Model load: {(metrics.modelLoadTime / 1000).toFixed(2)}s</Box>
							</Box>
							<Box display='flex' flexWrap='wrap' mbe={2}>
								<Box mie={16}>Model: {metrics.modelId.split('/').pop()}</Box>
								<Box mie={16}>Lang: {metrics.language}</Box>
								<Box mie={16}>Audio: {metrics.audioDuration}s ({(metrics.audioSize / 1024).toFixed(0)} KB)</Box>
							</Box>
							<Box display='flex' flexWrap='wrap' alignItems='center'>
								<Box mie={16}>JS Heap: {metrics.heapBefore} → {metrics.heapAfter} MB</Box>
								<Box mie={16}>GPU: {metrics.gpu}</Box>
								{metrics.deviceMemory > 0 && <Box mie={16}>Browser RAM: {metrics.deviceMemory} GB</Box>}
								<Box mie={16}>CPU: {metrics.cpuCores} cores</Box>
								{modelLoaded && (
									<Box
										is='button'
										fontScale='micro'
										color='danger'
										bg='transparent'
										borderWidth={0}
										style={{ cursor: 'pointer', textDecoration: 'underline' }}
										onClick={unloadModel}
									>
										Unload model
									</Box>
								)}
							</Box>
						</Box>
					)}
				</Box>
			)}
			{status === 'error' && transcript && (
				<Box color='danger' fontScale='c1' mbs={4}>
					{t('Error')}: {transcript}
				</Box>
			)}
		</>
	);
};

export default AudioAttachment;
