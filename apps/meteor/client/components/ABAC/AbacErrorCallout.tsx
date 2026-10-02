import { Box, Callout } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { getAbacErrorAttributes, getAbacErrorType } from './getAbacErrorType';

type AbacErrorCalloutProps = {
	error: unknown;
	fallback: TranslationKey;
};

const AbacErrorCallout = ({ error, fallback }: AbacErrorCalloutProps) => {
	const { t, i18n } = useTranslation();
	const errorType = getAbacErrorType(error);
	const attributes = getAbacErrorAttributes(error);

	return (
		<Callout type='danger'>
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
