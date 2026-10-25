import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { Box, Button, Callout } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

type AbacError = {
	errorType?: string;
	details?: { attributes?: IAbacAttributeDefinition[] };
};

type AbacErrorCalloutProps = {
	error: unknown;
	fallback: TranslationKey;
	onRetry?: () => void;
	retrying?: boolean;
};

const AbacErrorCallout = ({ error, fallback, onRetry, retrying = false }: AbacErrorCalloutProps) => {
	const { t, i18n } = useTranslation();
	const { errorType, details } = (error ?? {}) as AbacError;
	const attributes = details?.attributes ?? [];

	return (
		<Callout
			type='danger'
			role='alert'
			actions={
				onRetry && (
					<Button small loading={retrying} onClick={onRetry}>
						{t('Retry')}
					</Button>
				)
			}
		>
			{errorType && i18n.exists(errorType) ? t(errorType) : t(fallback)}
			{attributes.length > 0 && (
				<Box is='ul' marginBlockStart={4}>
					{attributes.map(({ key, values }) => (
						<li key={key}>
							{key}: {values.join(', ')}
						</li>
					))}
				</Box>
			)}
		</Callout>
	);
};

export default AbacErrorCallout;
