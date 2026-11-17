import { isIntelligentSearchErrorCode, type IntelligentSearchErrorCode } from '@rocket.chat/ai-search';
import { Button, Callout, type CalloutProps } from '@rocket.chat/fuselage';
import { useRouter, type TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useCanManageAISettings } from '../hooks/useCanManageAISettings';

const PIPELINE_SETTINGS = [
	'AI_Intelligent_Search_Pipeline_Base_URL',
	'AI_Intelligent_Search_Pipeline_ID',
	'AI_Intelligent_Search_API_Key',
	'AI_Intelligent_Search_API_Key_Secret',
];

type ErrorMessage = {
	type: 'info' | 'warning' | 'danger';
	title: TranslationKey;
	description: TranslationKey;
	action?: 'retry' | 'settings';
};

const adminMessages: Record<IntelligentSearchErrorCode, ErrorMessage> = {
	'error-ai-search-credentials-rejected': {
		type: 'danger',
		title: 'AI_Search_error_credentials_rejected_title',
		description: 'AI_Search_error_credentials_rejected_description',
		action: 'settings',
	},
	'error-ai-search-pipeline-not-found': {
		type: 'danger',
		title: 'AI_Search_error_pipeline_not_found_title',
		description: 'AI_Search_error_pipeline_not_found_description',
		action: 'settings',
	},
	'error-ai-search-unreachable': {
		type: 'danger',
		title: 'AI_Search_error_not_responding_title',
		description: 'AI_Search_error_not_responding_description',
		action: 'settings',
	},
	'error-ai-search-url-blocked': {
		type: 'danger',
		title: 'AI_Search_error_url_blocked_title',
		description: 'AI_Search_error_url_blocked_description',
		action: 'settings',
	},
	'error-ai-search-timeout': {
		type: 'warning',
		title: 'AI_Search_error_not_responding_title',
		description: 'AI_Search_error_not_responding_description',
		action: 'retry',
	},
	'error-ai-search-unavailable': {
		type: 'warning',
		title: 'AI_Search_error_unavailable_title',
		description: 'AI_Search_error_try_again_description',
		action: 'retry',
	},
	'error-ai-search-request-failed': {
		type: 'warning',
		title: 'AI_Search_error_request_failed_title',
		description: 'AI_Search_error_try_again_description',
		action: 'retry',
	},
};

const userMessage: ErrorMessage = {
	type: 'warning',
	title: 'AI_Search_error_unavailable_title',
	description: 'AI_Search_error_try_again_description',
	action: 'retry',
};

const adminNotConfiguredMessage: ErrorMessage = {
	type: 'warning',
	title: 'Intelligent_Search_missing_configuration_title',
	description: 'Intelligent_Search_missing_configuration_description',
	action: 'settings',
};

const userNotConfiguredMessage: ErrorMessage = {
	type: 'info',
	title: 'AI_Search_error_not_configured_title',
	description: 'AI_Search_error_not_configured_description',
};

const getErrorCode = (error: unknown): IntelligentSearchErrorCode => {
	const errorType = typeof error === 'object' && error !== null && 'errorType' in error ? error.errorType : undefined;

	return isIntelligentSearchErrorCode(errorType) ? errorType : 'error-ai-search-request-failed';
};

type AISearchErrorCalloutProps = Omit<CalloutProps, 'type' | 'title' | 'actions'> & {
	error?: unknown;
	notConfigured?: boolean;
	onRetry?: () => void;
};

const AISearchErrorCallout = ({ error, notConfigured = false, onRetry, ...props }: AISearchErrorCalloutProps): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();
	const canManageAISettings = useCanManageAISettings(PIPELINE_SETTINGS);

	const getMessage = (): ErrorMessage => {
		if (notConfigured) {
			return canManageAISettings ? adminNotConfiguredMessage : userNotConfiguredMessage;
		}

		return canManageAISettings ? adminMessages[getErrorCode(error)] : userMessage;
	};
	const { type, title, description, action } = getMessage();

	const getActions = () => {
		if (action === 'retry' && onRetry) {
			return (
				<Button size='small' onClick={onRetry}>
					{t('Try_again')}
				</Button>
			);
		}

		if (action === 'settings') {
			return (
				<Button size='small' onClick={() => router.navigate({ name: 'admin-ai-center', params: { section: 'search' } })}>
					{t('Open_AI_center')}
				</Button>
			);
		}

		return undefined;
	};

	return (
		<Callout type={type} title={t(title)} actions={getActions()} {...props}>
			{t(description)}
		</Callout>
	);
};

export default AISearchErrorCallout;
