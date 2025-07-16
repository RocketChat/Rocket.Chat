import type { Serialized } from '@rocket.chat/core-typings';
import { Box, Icon, Scrollable } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { ansispan } from './ansispan';

type StdOutLogEntry = {
	id: string;
	string: string;
	ts: Date;
};

const compareEntries = (a: StdOutLogEntry, b: StdOutLogEntry): number => a.ts.getTime() - b.ts.getTime();

const unserializeEntry = ({ ts, ...entry }: Serialized<StdOutLogEntry>): StdOutLogEntry => ({
	ts: new Date(ts),
	...entry,
});

const ServerLogs = (): ReactElement => {
	const [entries, setEntries] = useState<StdOutLogEntry[]>([]);

	const dispatchToastMessage = useToastMessageDispatch();

	const getStdoutQueue = useEndpoint('GET', '/v1/stdout.queue');
	const subscribeToStdout = useStream('stdout');

	useEffect(() => {
		const fetchLines = async (): Promise<void> => {
			try {
				const { queue } = await getStdoutQueue(undefined);
				setEntries(queue.map(unserializeEntry).sort(compareEntries));
			} catch (error: unknown) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		};

		fetchLines();
	}, [dispatchToastMessage, getStdoutQueue]);

	useEffect(
		() =>
			subscribeToStdout('stdout', (entry: StdOutLogEntry) => {
				setEntries((entries) => [...entries, entry]);
			}),
		[subscribeToStdout],
	);

	const { t } = useTranslation();

	const wrapperRef = useRef<HTMLElement>();
	const atBottomRef = useRef<boolean>(false);

	const [newLogsVisible, setNewLogsVisible] = useState(false);

	const isAtBottom = useCallback<(scrollThreshold?: number) => boolean>((scrollThreshold = 0) => {
		const wrapper = wrapperRef.current;

		if (!wrapper) {
			return false;
		}

		if (wrapper.scrollTop + scrollThreshold >= wrapper.scrollHeight - wrapper.clientHeight) {
			setNewLogsVisible(false);
			return true;
		}
		return false;
	}, []);

	const sendToBottom = useCallback(() => {
		const wrapper = wrapperRef.current;

		if (!wrapper) {
			return;
		}

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

		if (!wrapper) {
			return;
		}

		if (window.MutationObserver) {
			const observer = new MutationObserver((mutations) => {
				mutations.forEach(() => {
					sendToBottomIfNecessary();
				});
			});
			observer.observe(wrapper, { childList: true });

			return (): void => {
				observer.disconnect();
			};
		}

		const handleSubtreeModified = (): void => {
			sendToBottomIfNecessary();
		};
		wrapper.addEventListener('DOMSubtreeModified', handleSubtreeModified);

		return (): void => {
			wrapper.removeEventListener('DOMSubtreeModified', handleSubtreeModified);
		};
	}, [sendToBottomIfNecessary]);

	useEffect(() => {
		const handleWindowResize = (): void => {
			setTimeout(() => {
				sendToBottomIfNecessary();
			}, 100);
		};

		window.addEventListener('resize', handleWindowResize);

		return (): void => {
			window.removeEventListener('resize', handleWindowResize);
		};
	}, [sendToBottomIfNecessary]);

	const handleWheel = useCallback(() => {
		atBottomRef.current = false;
		setTimeout(() => {
			checkIfScrollIsAtBottom();
		}, 100);
	}, [checkIfScrollIsAtBottom]);

	const handleTouchStart = (): void => {
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

	return (
		<Box width='full' height='full' overflow='hidden' position='relative' display='flex' mbe={8}>
			<Scrollable vertical>
				<Box
					ref={wrapperRef}
					display='flex'
					flexDirection='column'
					padding={8}
					flexGrow={1}
					fontFamily='mono'
					color='default'
					bg='neutral'
					style={{ wordBreak: 'break-all' }}
					onWheel={handleWheel}
					onTouchStart={handleTouchStart}
					onTouchEnd={handleTouchEnd}
					onScroll={handleScroll}
					borderRadius='x4'
				>
					{entries.sort(compareEntries).map(({ string }, i) => (
						<span key={i} dangerouslySetInnerHTML={{ __html: ansispan(string) }} />
					))}
				</Box>
			</Scrollable>
			<Box
				role='button'
				position='absolute'
				display='flex'
				justifyContent='center'
				insetBlockEnd={8}
				insetInlineStart='50%'
				width='x132'
				height='x32'
				marginInline='neg-x64'
				paddingBlock={8}
				fontScale='c2'
				borderRadius='full'
				elevation='1'
				color='default'
				bg='light'
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
	);
};

export default ServerLogs;
