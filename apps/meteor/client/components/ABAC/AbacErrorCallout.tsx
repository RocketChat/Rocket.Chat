import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { Box, Callout } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

type AbacError = {
	errorType?: string;
	details?: { attributes?: IAbacAttributeDefinition[] };
};

type AbacErrorCalloutProps = {
	error: unknown;
	fallback: TranslationKey;
};

const AbacErrorCallout = ({ error, fallback }: AbacErrorCalloutProps) => {
	const { t, i18n } = useTranslation();
	const { errorType, details } = (error ?? {}) as AbacError;
	const attributes = details?.attributes ?? [];

	return (
		<Callout type='danger' role='alert'>
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
