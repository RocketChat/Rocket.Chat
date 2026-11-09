import type { ILogItem } from '@rocket.chat/core-typings';
import { Text } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';

import RichContent from '../../../../../components/RichContent';
import { useHighlightedCode } from '../../../../../hooks/useHighlightedCode';

export type AppLogsItemEntryProps = {
	fullLog: ILogItem;
};

const AppLogsItemEntry = ({ fullLog }: AppLogsItemEntryProps) => {
	return (
		<Text color='default'>
			<RichContent>
				<pre>
					<code
						dangerouslySetInnerHTML={{
							__html: DOMPurify.sanitize(useHighlightedCode('json', JSON.stringify(fullLog, null, 2))),
						}}
					/>
				</pre>
			</RichContent>
		</Text>
	);
};

export default AppLogsItemEntry;
