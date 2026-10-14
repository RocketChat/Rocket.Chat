import { Box, Button, Card, CardBody, CardControls, CardHeader, CardTitle, FramedIcon, Skeleton } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../../components/MarkdownText';
import { useCanManageAISettings } from '../../hooks/useCanManageAISettings';

const adminAnswerErrors: Record<string, TranslationKey> = {
	'error-ai-provider-request-failed': 'Search_AI_answer_error_provider_request_failed',
	'error-ai-provider-empty-response': 'Search_AI_answer_error_provider_empty_response',
	'error-ai-provider-not-configured': 'Search_AI_answer_disabled',
};

const getAnswerErrorMessage = (error: unknown, canManageAISettings: boolean): TranslationKey => {
	if (!canManageAISettings) {
		return 'Search_AI_answer_error_unavailable';
	}

	const errorType = typeof error === 'object' && error !== null && 'errorType' in error ? error.errorType : undefined;

	return (typeof errorType === 'string' && adminAnswerErrors[errorType]) || 'Search_AI_answer_error';
};

export type SearchAnswerPanelProps = {
	answer?: string;
	provider?: { name: string; model: string };
	isLoading: boolean;
	error?: unknown;
	disabled: boolean;
	emptyReason: string;
	onGenerate: () => void;
};

const SearchAnswerPanel = ({
	answer,
	provider,
	isLoading,
	error,
	disabled,
	emptyReason,
	onGenerate,
}: SearchAnswerPanelProps): ReactElement => {
	const { t } = useTranslation();
	const titleId = useId();
	const canManageAISettings = useCanManageAISettings();

	let content: ReactElement;
	if (isLoading) {
		content = (
			<Box display='flex' flexDirection='column' gap={12} aria-busy='true' aria-label={t('Loading')}>
				<Skeleton width='60%' />
				<Skeleton width='100%' />
				<Skeleton width='95%' />
				<Skeleton width='88%' />
				<Skeleton width='72%' />
			</Box>
		);
	} else if (answer) {
		content = <MarkdownText content={answer} parseEmoji fontScale='p2' />;
	} else {
		content = (
			<Box color='hint' fontScale='p2'>
				{disabled ? emptyReason : t('Search_AI_answer_ready')}
			</Box>
		);
	}

	return (
		<Box marginBlockEnd={24}>
			<Card role='region' aria-labelledby={titleId}>
				<CardHeader>
					<FramedIcon icon='stars' />
					<CardTitle id={titleId}>{t('Search_AI_answer')}</CardTitle>
				</CardHeader>
				<CardBody flexDirection='column'>
					{provider && (
						<Box color='hint' fontScale='c1' marginBlockEnd={8}>
							{t('Search_AI_answer_provider', { provider: provider.name, model: provider.model })}
						</Box>
					)}
					{error && !isLoading ? (
						<Box color='danger' fontScale='p2'>
							{t(getAnswerErrorMessage(error, canManageAISettings))}
						</Box>
					) : (
						content
					)}
				</CardBody>
				<CardControls>
					<Button medium disabled={disabled || isLoading} onClick={onGenerate}>
						{isLoading ? t('Loading') : t(answer ? 'Regenerate' : 'Generate')}
					</Button>
				</CardControls>
			</Card>
		</Box>
	);
};

export default SearchAnswerPanel;
