import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import { useHighlightedCode } from '../../../../../../hooks/useHighlightedCode';

type AppLogsItemEntryProps = {
	severity: string;
	timestamp: string;
	caller: string;
	args: unknown;
};

const AppLogsItemEntry: FC<AppLogsItemEntryProps> = ({ severity, timestamp, caller, args }) => {
	const t = useTranslation();

	return (
		<Box>
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
