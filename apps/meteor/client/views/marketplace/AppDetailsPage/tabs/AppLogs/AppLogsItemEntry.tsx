import type { ILogItem } from '@rocket.chat/core-typings';
import { Box, Text } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';

import { useHighlightedCode } from '../../../../../hooks/useHighlightedCode';

export type AppLogsItemEntryProps = {
	fullLog: ILogItem;
};

const AppLogsItemEntry = ({ fullLog }: AppLogsItemEntryProps) => {
	return (
		<Text color='default'>
			<Box withRichContent width='full'>
				<pre>
					<code
						dangerouslySetInnerHTML={{
							__html: DOMPurify.sanitize(useHighlightedCode('json', JSON.stringify(fullLog, null, 2))),
						}}
					/>
				</pre>
			</Box>
		</Text>
	);
};

export default AppLogsItemEntry;
