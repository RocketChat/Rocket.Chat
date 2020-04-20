import { Meteor } from 'meteor/meteor';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box } from '@rocket.chat/fuselage';

import { ansispan } from '../../ansispan';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { useEndpoint } from '../../../../../client/contexts/ServerContext';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { Page } from '../../../../../client/components/basic/Page';
import '../../views/viewLogs.css';

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
	const newLogsRef = useRef();
	const atBottomRef = useRef();

	const isAtBottom = useCallback((scrollThreshold) => {
		const wrapper = wrapperRef.current;
		const newLogs = newLogsRef.current;

		if (scrollThreshold == null) {
			scrollThreshold = 0;
		}
		if (wrapper.scrollTop + scrollThreshold >= wrapper.scrollHeight - wrapper.clientHeight) {
			newLogs.className = 'new-logs not';
			return true;
		}
		return false;
	}, []);

	const sendToBottom = useCallback(() => {
		const wrapper = wrapperRef.current;
		const newLogs = newLogsRef.current;

		wrapper.scrollTop = wrapper.scrollHeight - wrapper.clientHeight;
		newLogs.className = 'new-logs not';
	}, []);

	const checkIfScrollIsAtBottom = useCallback(() => {
		atBottomRef.current = isAtBottom(100);
	}, [isAtBottom]);

	const sendToBottomIfNecessary = useCallback(() => {
		if (atBottomRef.current === true && isAtBottom() !== true) {
			sendToBottom();
		} else if (atBottomRef.current === false) {
			newLogsRef.current.className = 'new-logs';
		}
	}, [isAtBottom, sendToBottom]);

	useEffect(() => {
		if (window.MutationObserver) {
			const observer = new MutationObserver((mutations) => {
				mutations.forEach(() => sendToBottomIfNecessary());
			});
			observer.observe(wrapperRef.current, { childList: true });

			return () => {
				observer.disconnect();
			};
		}

		const handleSubtreeModified = () => {
			sendToBottomIfNecessary();
		};
		wrapperRef.current.addEventListener('DOMSubtreeModified', handleSubtreeModified);

		return () => {
			wrapperRef.current.removeEventListener('DOMSubtreeModified', handleSubtreeModified);
		};
	}, [sendToBottomIfNecessary]);

	useEffect(() => {
		const handleWindowResize = () => {
			setTimeout(() => {
				sendToBottomIfNecessary();
			}, 100);
		};

		window.addEventListener('resize', handleWindowResize);

		return () => {
			window.removeEventListener('resize', handleWindowResize);
		};
	}, [sendToBottomIfNecessary]);

	const handleWheel = useCallback(() => {
		atBottomRef.current = false;
		setTimeout(() => {
			checkIfScrollIsAtBottom();
		}, 100);
	}, [checkIfScrollIsAtBottom]);

	const handleTouchStart = () => {
		atBottomRef.current = false;
	};

	const handleTouchEnd = useCallback(() => {
		setTimeout(() => {
			checkIfScrollIsAtBottom();
		}, 100);
	}, [checkIfScrollIsAtBottom]);

	const handleScroll = useCallback(() => {
		atBottomRef.current = false;
		setTimeout(() => {
			checkIfScrollIsAtBottom();
		}, 100);
	}, [checkIfScrollIsAtBottom]);

	const handleClick = useCallback(() => {
		atBottomRef.current = true;
		sendToBottomIfNecessary();
	}, [sendToBottomIfNecessary]);

	return <Page>
		<Page.Header title={t('View Logs')} />
		<Page.Content>
			<Box
				ref={wrapperRef}
				className='view-logs__terminal'
				margin='none'
				paddingBlock='8px'
				paddingInline='10px'
				flexGrow={1}
				width='full'
				height='full'
				dangerouslySetInnerHTML={{ __html: lines.sort((a, b) => a.ts - b.ts).map(({ string }) => ansispan(string)).join('\n') }}
				onClick={handleWheel}
				onWheel={handleWheel}
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
				onScroll={handleScroll}
			/>
			<div
				ref={newLogsRef}
				className='new-logs js-new-logs not color-primary-action-color'
				onClick={handleClick}
			>
				<i className='icon-down-big' />
				<span>{t('New_logs')}</span>
			</div>
		</Page.Content>
	</Page>;
}
