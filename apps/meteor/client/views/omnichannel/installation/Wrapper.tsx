import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

const Wrapper = (text: string): ReactElement => (
	<Box fontFamily='mono' alignSelf='center' fontScale='p2' style={{ wordBreak: 'break-all' }} mie='x4' flexGrow={1} withRichContent>
		<pre>
			<code>{text}</code>
		</pre>
	</Box>
);

export default Wrapper;
