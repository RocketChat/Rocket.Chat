import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useHighlightedCode } from '../../../../../hooks/useHighlightedCode';

type AppLogsItemEntryProps = {
	severity: string;
	timestamp: string;
	caller: string;
	args: unknown;
};

const AppLogsItemEntry = ({ severity, timestamp, caller, args }: AppLogsItemEntryProps) => {
	const t = useTranslation();

	return (
		<Box color='default'>
			<Box>
				{severity}: {timestamp} {t('Caller')}: {caller}
			</Box>
			<Box withRichContent width='full'>
				<pre>
					<code
						dangerouslySetInnerHTML={{
							__html: useHighlightedCode('json', JSON.stringify(args, null, 2)),
						}}
					/>
				</pre>
			</Box>
		</Box>
	);
};

export default AppLogsItemEntry;
