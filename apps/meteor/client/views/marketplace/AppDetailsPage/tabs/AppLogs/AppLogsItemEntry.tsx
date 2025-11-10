import type { ILogItem } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';

import { useHighlightedCode } from '../../../../../hooks/useHighlightedCode';

type AppLogsItemEntryProps = {
	fullLog: ILogItem;
};

const AppLogsItemEntry = ({ fullLog }: AppLogsItemEntryProps) => {
	return (
		<Box color='default'>
			<Box withRichContent width='full'>
				<pre>
					<code
						dangerouslySetInnerHTML={{
							__html: DOMPurify.sanitize(useHighlightedCode('json', JSON.stringify(fullLog, null, 2))),
						}}
					/>
				</pre>
			</Box>
		</Box>
	);
};

export default AppLogsItemEntry;
