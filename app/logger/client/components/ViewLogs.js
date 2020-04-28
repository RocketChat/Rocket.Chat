import { Meteor } from 'meteor/meteor';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Scrollable } from '@rocket.chat/fuselage';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useEndpoint } from '../../../../client/contexts/ServerContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { Page } from '../../../../client/components/basic/Page';

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
		if (window.MutationObserver) {
			const observer = new MutationObserver((mutations) => {
				mutations.forEach(() => {
					sendToBottomIfNecessary();
				});
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
				width='full'
				height='full'
				style={{ overflow: 'hidden', position: 'relative' }}
				display='flex'
				// flexGrow={1}
			>
				<Scrollable vertical>
					<Box
						ref={wrapperRef}
						margin='none'
						paddingBlock='8px'
						paddingInline='10px'
						flexGrow={1}
						textStyle='mono'
						textColor='alternative'
						style={{ backgroundColor: '#444444' }}
						onWheel={handleWheel}
						onTouchStart={handleTouchStart}
						onTouchEnd={handleTouchEnd}
						onScroll={handleScroll}
					>
						{lines.sort((a, b) => a.ts - b.ts).map(({ string }, i) =>
							<Box
								key={i}
								style={{ wordBreak: 'break-all' }}
								dangerouslySetInnerHTML={{ __html: ansispan(string) }}
							/>)}
					</Box>
				</Scrollable>
				<Box
					onClick={handleClick}
					style={{ position: 'absolute',
						bottom: '8px',
						left: '50%',
						width: '130px',
						height: '30px',
						margin: 'o -65px',
						cursor: 'pointer',
						transition: 'transform 0.3s ease-out',
						transform: newLogsVisible ? 'translateY(0)' : 'translateY(150%)',
						textAlign: 'center',
						borderRadius: '20px',
						fontSize: '0.8em',
						lineHeight: '30px',
						color: 'var(--color-blue)',
						backgroundColor: '#FFF' }}
				>
					<i className='icon-down-big' />
					<span>{t('New_logs')}</span>
				</Box>
			</Box>
		</Page.Content>
	</Page>;
}

export default ViewLogs;
