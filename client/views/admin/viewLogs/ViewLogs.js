import { Meteor } from 'meteor/meteor';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Icon, Scrollable } from '@rocket.chat/fuselage';

import Page from '../../../components/Page';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const foregroundColors = {
	30: 'gray',
	31: 'red',
	32: 'lime',
	33: 'yellow',
	34: '#6B98FF',
	35: '#FF00FF',
	36: 'cyan',
	37: 'white',
};

const ansispan = (str) => {
	str =	str
		.replace(/\s/g, '&nbsp;')
		.replace(/(\\n|\n)/g, '<br>')
		.replace(/>/g, '&gt;')
		.replace(/</g, '&lt;')
		.replace(/(.\d{8}-\d\d:\d\d:\d\d\.\d\d\d\(?.{0,2}\)?)/, '<span>$1</span>')
		.replace(/\033\[1m/g, '<strong>')
		.replace(/\033\[22m/g, '</strong>')
		.replace(/\033\[3m/g, '<em>')
		.replace(/\033\[23m/g, '</em>')
		.replace(/\033\[m/g, '</span>')
		.replace(/\033\[0m/g, '</span>')
		.replace(/\033\[39m/g, '</span>');
	return Object.entries(foregroundColors).reduce((str, [ansiCode, color]) => {
		const span = `<span style="color: ${ color }">`;
		return (
			str
				.replace(new RegExp(`\\033\\[${ ansiCode }m`, 'g'), span)
				.replace(new RegExp(`\\033\\[0;${ ansiCode }m`, 'g'), span)
		);
	}, str);
};

function ViewLogs() {
	const [lines, setLines] = useState([]);
	window.setLines = setLines;

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
	}, [dispatchToastMessage, getStdoutQueue]);

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
	const atBottomRef = useRef();

	const [newLogsVisible, setNewLogsVisible] = useState(false);

	const isAtBottom = useCallback((scrollThreshold) => {
		const wrapper = wrapperRef.current;

		if (scrollThreshold == null) {
			scrollThreshold = 0;
		}
		if (wrapper.scrollTop + scrollThreshold >= wrapper.scrollHeight - wrapper.clientHeight) {
			setNewLogsVisible(false);
			return true;
		}
		return false;
	}, []);

	const sendToBottom = useCallback(() => {
		const wrapper = wrapperRef.current;

		wrapper.scrollTop = wrapper.scrollHeight - wrapper.clientHeight;
		setNewLogsVisible(false);
	}, []);

	const checkIfScrollIsAtBottom = useCallback(() => {
		atBottomRef.current = isAtBottom(100);
	}, [isAtBottom]);

	const sendToBottomIfNecessary = useCallback(() => {
		if (atBottomRef.current === true && isAtBottom() !== true) {
			sendToBottom();
		} else if (atBottomRef.current === false) {
			setNewLogsVisible(true);
		}
	}, [isAtBottom, sendToBottom]);

	useEffect(() => {
		const wrapper = wrapperRef.current;
		if (window.MutationObserver) {
			const observer = new MutationObserver((mutations) => {
				mutations.forEach(() => {
					sendToBottomIfNecessary();
				});
			});
			observer.observe(wrapper, { childList: true });

			return () => {
				observer.disconnect();
			};
		}

		const handleSubtreeModified = () => {
			sendToBottomIfNecessary();
		};
		wrapper.addEventListener('DOMSubtreeModified', handleSubtreeModified);

		return () => {
			wrapper.removeEventListener('DOMSubtreeModified', handleSubtreeModified);
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
				width='full'
				height='full'
				overflow='hidden'
				position='relative'
				display='flex'
				marginBlock='x8'
			>
				<Scrollable vertical>
					<Box
						ref={wrapperRef}
						display='flex'
						flexDirection='column'
						padding='x8'
						flexGrow={1}
						fontFamily='mono'
						color='alternative'
						backgroundColor='neutral-800'
						style={{ wordBreak: 'break-all' }}
						onWheel={handleWheel}
						onTouchStart={handleTouchStart}
						onTouchEnd={handleTouchEnd}
						onScroll={handleScroll}
					>
						{lines.sort((a, b) => a.ts - b.ts).map(({ string }, i) =>
							<span key={i} dangerouslySetInnerHTML={{ __html: ansispan(string) }} />)}
					</Box>
				</Scrollable>
				<Box
					position='absolute'
					insetBlockEnd='x8'
					insetInlineStart='50%'
					width='x132'
					height='x32'
					marginInline='neg-x64'
					paddingBlock='x8'
					fontScale='c1'
					borderRadius='full'
					color='primary-500'
					backgroundColor='surface'
					onClick={handleClick}
					textAlign='center'
					style={{
						cursor: 'pointer',
						transition: 'transform 0.3s ease-out',
						transform: newLogsVisible ? 'translateY(0)' : 'translateY(150%)',
					}}
				>
					<Icon name='jump' size='x16' /> {t('New_logs')}
				</Box>
			</Box>
		</Page.Content>
	</Page>;
}

export default ViewLogs;
