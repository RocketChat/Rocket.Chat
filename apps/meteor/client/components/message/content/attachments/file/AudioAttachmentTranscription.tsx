import type { AudioTranscription } from '@rocket.chat/core-typings';
import { Box, Throbber } from '@rocket.chat/fuselage';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const TRANSCRIPT_PREVIEW_LENGTH = 280;

type AudioAttachmentTranscriptionProps = {
	transcription: AudioTranscription;
};

const AudioAttachmentTranscription = ({ transcription }: AudioAttachmentTranscriptionProps) => {
	const { t } = useTranslation();
	const [expanded, setExpanded] = useState(false);

	if (transcription.status === 'pending') {
		return (
			<Box display='flex' alignItems='center' marginBlockStart={8} color='hint' fontScale='c1'>
				<Throbber inheritColor size='x12' />
				<Box marginInlineStart={8}>{t('Transcribing')}</Box>
			</Box>
		);
	}

	if (transcription.status !== 'done' || !transcription.text) {
		return null;
	}

	const text = transcription.text.trim();
	const needsTruncation = text.length > TRANSCRIPT_PREVIEW_LENGTH;
	const visibleText = !needsTruncation || expanded ? text : `${text.slice(0, TRANSCRIPT_PREVIEW_LENGTH).trimEnd()}…`;

	return (
		<Box marginBlockStart={8} color='hint' fontScale='p2' wordBreak='break-word'>
			{visibleText}
			{needsTruncation && (
				<Box
					is='button'
					type='button'
					display='inline'
					backgroundColor='transparent'
					borderWidth={0}
					padding={0}
					marginInlineStart={4}
					color='info'
					fontScale='p2'
					style={{ cursor: 'pointer' }}
					onClick={() => setExpanded((current) => !current)}
				>
					{expanded ? t('Show_less') : t('Show_more')}
				</Box>
			)}
		</Box>
	);
};

export default AudioAttachmentTranscription;
