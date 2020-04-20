import { Meteor } from 'meteor/meteor';
import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@rocket.chat/fuselage';

import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { useEndpoint } from '../../../../../client/contexts/ServerContext';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { Page } from '../../../../../client/components/basic/Page';
import { ansispan } from '../../ansispan';

export function ViewLogs() {
	const [lines, setLines] = useState([]);

	const dispatchToastMessage = useToastMessageDispatch();

	const getStdoutQueue = useEndpoint('GET', 'stdout.queue');

	useEffect(() => {
		const fetchLines = async () => {
			try {
				const { queue } = await getStdoutQueue();
				setLines(queue);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		};

		fetchLines();
	}, []);

	useEffect(() => {
		const stdoutStreamer = new Meteor.Streamer('stdout');

		const handleStdout = (line) => {
			setLines((lines) => [...lines, line]);
		};

		stdoutStreamer.on('stdout', handleStdout);

		return () => {
			stdoutStreamer.removeListener('stdout');
		};
	}, []);

	const t = useTranslation();

	const wrapperRef = useRef();

	// const isAtBottom = useCallback((scrollThreshold) => {
	// 	if (scrollThreshold == null) {
	// 		scrollThreshold = 0;
	// 	}
	// 	if (wrapper.scrollTop + scrollThreshold >= wrapper.scrollHeight - wrapper.clientHeight) {
	// 		newLogs.className = 'new-logs not';
	// 		return true;
	// 	}
	// 	return false;
	// });

	return <Page>
		<Page.Header title={t('View Logs')} />
		<Page.Content>
			<Box ref={wrapperRef} className='view-logs__terminal' margin='none' paddingBlock='8px' paddingInline='10px' flexGrow={1} width='full' height='full' dangerouslySetInnerHTML={{ __html: lines.map(({ string }) => ansispan(string)).join('\n') }}
				// onMouseWheel={handleHandleWheel}
			/>
		</Page.Content>
	</Page>;
}
