import { Box } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';

import { useHighlightedCode } from '../../../../../hooks/useHighlightedCode';

type AppLogsItemEntryProps = {
	severity: string;
	timestamp: string;
	caller: string;
	args: unknown;
};

const AppLogsItemEntry = ({ severity, timestamp, caller, args }: AppLogsItemEntryProps) => {
	const { t } = useTranslation();

	return (
		<Box color='default'>
			<Box>
				{severity}: {timestamp} {t('Caller')}: {caller}
			</Box>
			<Box withRichContent width='full'>
				<pre>
					<code
						dangerouslySetInnerHTML={{
							__html: DOMPurify.sanitize(useHighlightedCode('json', JSON.stringify(args, null, 2))),
						}}
					/>
				</pre>
			</Box>
		</Box>
	);
};

export default AppLogsItemEntry;
