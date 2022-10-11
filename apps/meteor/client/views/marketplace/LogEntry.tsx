import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import { useHighlightedCode } from '../../../hooks/useHighlightedCode';

type LogEntryProps = {
	severity: string;
	timestamp: string;
	caller: string;
	args: unknown;
};

const LogEntry: FC<LogEntryProps> = ({ severity, timestamp, caller, args }) => {
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

export default LogEntry;
