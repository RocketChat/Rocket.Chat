import { Box, Button, Icon } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenu, GenericModal } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useTranscribeAudio } from './hooks/useTranscribeAudio';

const LANGUAGES = [
	{ code: '', label: 'Auto-detect' },
	{ code: 'en', label: 'English' },
	{ code: 'pt', label: 'Português' },
] as const;

const MODELS = [
	{ id: 'onnx-community/whisper-tiny', label: 'Tiny (~40 MB)', shortLabel: 'Tiny' },
	{ id: 'onnx-community/whisper-small', label: 'Small (~150 MB)', shortLabel: 'Small' },
] as const;

type TranscribeButtonProps = {
	src: string;
};

const TranscribeButton = ({ src }: TranscribeButtonProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const { transcribe, unloadModel, modelLoaded, status, transcript, progress, metrics, isSupported } = useTranscribeAudio();
	const [language, setLanguage] = useLocalStorage<string>('transcribe.language', '');
	const [modelId, setModelId] = useLocalStorage<string>('transcribe.model', 'onnx-community/whisper-small');
	const [showMetrics, setShowMetrics] = useLocalStorage<boolean>('transcribe.showMetrics', true);

	const doTranscribe = useCallback(() => {
		transcribe(src, language || undefined, modelId);
	}, [transcribe, src, language, modelId]);

	const handleTranscribe = useCallback(() => {
		if (status !== 'idle' && status !== 'error' && status !== 'done') return;

		if (!modelLoaded) {
			const selectedModelLabel = MODELS.find((m) => m.id === modelId)?.label || modelId;
			setModal(
				<GenericModal
					variant='info'
					title={t('Download_model_title')}
					confirmText={t('Download_and_transcribe')}
					onClose={() => setModal(null)}
					onCancel={() => setModal(null)}
					onConfirm={() => {
						setModal(null);
						doTranscribe();
					}}
				>
					{t('Download_model_warning', { model: selectedModelLabel })}
				</GenericModal>,
			);
			return;
		}
		doTranscribe();
	}, [status, modelLoaded, modelId, setModal, t, doTranscribe]);

	const isLoading = status === 'loading-model' || status === 'transcribing';

	const buttonLabel = () => {
		if (status === 'loading-model') return progress ? `${t('Downloading_model')} ${progress}` : t('Downloading_model');
		if (status === 'transcribing') return t('Transcribing');
		return t('Transcribe');
	};

	const menuSections = useMemo(() => {
		const languageItems: GenericMenuItemProps[] = LANGUAGES.map((lang) => ({
			id: `lang-${lang.code || 'auto'}`,
			content: lang.label,
			icon: language === lang.code ? ('check' as const) : undefined,
			onClick: () => setLanguage(lang.code),
		}));

		const modelItems: GenericMenuItemProps[] = MODELS.map((model) => ({
			id: `model-${model.id}`,
			content: model.label,
			icon: modelId === model.id ? ('check' as const) : undefined,
			onClick: () => setModelId(model.id),
		}));

		const optionItems: GenericMenuItemProps[] = [
			{
				id: 'show-metrics',
				content: t('Show_metrics'),
				icon: showMetrics ? ('check' as const) : undefined,
				onClick: () => setShowMetrics(!showMetrics),
			},
			...(modelLoaded
				? [
						{
							id: 'unload-model',
							content: t('Unload_model'),
							icon: 'cross' as const,
							onClick: unloadModel,
							variant: 'danger' as const,
						},
					]
				: []),
		];

		return [
			{ title: t('Language'), items: languageItems },
			{ title: t('Model'), items: modelItems },
			{ title: '', items: optionItems },
		];
	}, [language, modelId, showMetrics, modelLoaded, unloadModel, setLanguage, setModelId, setShowMetrics, t]);

	if (!isSupported) {
		return null;
	}

	return (
		<>
			<Box mbs={4} display='flex' alignItems='center'>
				<Button small onClick={handleTranscribe} disabled={isLoading}>
					<Icon name='language' size='x16' mie={4} />
					{buttonLabel()}
				</Button>
				{!isLoading && (
					<GenericMenu detached icon='chevron-down' title={t('Transcribe')} sections={menuSections} placement='bottom-start' />
				)}
			</Box>
			{status === 'done' && transcript && (
				<Box mbs={4}>
					<Box p={8} bg='surface-tint' borderRadius={4} fontScale='p2' color='default'>
						{transcript}
					</Box>
					{metrics && showMetrics && (
						<Box mbs={4} p={6} bg='surface-neutral' borderRadius={4} fontScale='micro' color='hint'>
							<Box display='flex' flexWrap='wrap' mbe={2}>
								<Box mie={16} fontWeight={700}>
									Inference: {(metrics.inferenceTime / 1000).toFixed(2)}s
								</Box>
								<Box mie={16}>RT factor: {metrics.realtimeFactor}x</Box>
								<Box mie={16}>Model load: {(metrics.modelLoadTime / 1000).toFixed(2)}s</Box>
							</Box>
							<Box display='flex' flexWrap='wrap' mbe={2}>
								<Box mie={16}>Model: {metrics.modelId.split('/').pop()}</Box>
								<Box mie={16}>Lang: {metrics.language}</Box>
								<Box mie={16}>
									Audio: {metrics.audioDuration}s ({(metrics.audioSize / 1024).toFixed(0)} KB)
								</Box>
							</Box>
							<Box display='flex' flexWrap='wrap'>
								<Box mie={16}>
									JS Heap: {metrics.heapBefore} → {metrics.heapAfter} MB
								</Box>
								<Box mie={16}>GPU: {metrics.gpu}</Box>
								{metrics.deviceMemory > 0 && <Box mie={16}>Browser RAM: {metrics.deviceMemory} GB</Box>}
								<Box>CPU: {metrics.cpuCores} cores</Box>
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

export default TranscribeButton;
