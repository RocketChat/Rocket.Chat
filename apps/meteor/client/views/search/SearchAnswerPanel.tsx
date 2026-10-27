import { Box, Button, Card, CardBody, CardHeader, CardTitle, FramedIcon, Skeleton, CardControls } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import SearchAnswerContent from './SearchAnswerContent';
import { useCanManageAISettings } from '../../hooks/useCanManageAISettings';

const LLM_PROVIDER_SETTINGS = ['AI_LLM_OpenAI_Base_URL', 'AI_LLM_OpenAI_API_Key', 'AI_LLM_OpenAI_Model'];

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
	onRetry: () => void;
};

const SearchAnswerPanel = ({
	answer,
	provider,
	isLoading,
	error,
	disabled,
	emptyReason,
	onRetry,
}: SearchAnswerPanelProps): ReactElement => {
	const { t } = useTranslation();
	const titleId = useId();
	const info = provider ? t('Search_AI_answer_provider', { provider: provider.name, model: provider.model }) : t('Search_AI_overview_info');
	const canManageAISettings = useCanManageAISettings(LLM_PROVIDER_SETTINGS);

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
	} else if (error && !isLoading && !disabled) {
		content = (
			<Box display='flex' flexDirection='column' alignItems='flex-start' gap={12}>
				<Box color='danger' fontScale='p2'>
					{t(getAnswerErrorMessage(error, canManageAISettings))}
				</Box>
				<CardControls>
					<Button size='small' onClick={onRetry}>
						{t('Try_again')}
					</Button>
				</CardControls>
			</Box>
		);
	} else if (answer) {
		content = <SearchAnswerContent key={answer} answer={answer} />;
	} else {
		content = (
			<Box color='hint' fontScale='p2'>
				{disabled ? emptyReason : t('Search_AI_answer_ready')}
			</Box>
		);
	}

	return (
		<Box marginBlockEnd={40}>
			<Card role='region' aria-labelledby={titleId}>
				<CardHeader>
					<FramedIcon icon='stars' />
					<CardTitle id={titleId} info={info}>
						{t('Search_AI_answer')}
					</CardTitle>
				</CardHeader>
				<CardBody flexDirection='column'>{content}</CardBody>
			</Card>
		</Box>
	);
};

export default SearchAnswerPanel;
