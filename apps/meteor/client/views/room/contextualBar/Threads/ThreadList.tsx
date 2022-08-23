import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Box, Icon, TextInput, Select, Margins, Callout, Throbber } from '@rocket.chat/fuselage';
import { useResizeObserver, useMutableCallback, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useRoute, useCurrentRoute, useQueryStringParameter, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../../components/VerticalBar';
import { useTabContext } from '../../providers/ToolboxProvider';
import ThreadComponent from '../../threads/ThreadComponent';
import ThreadRow from './ThreadRow';
import { withData } from './withData';

export type ThreadListProps = {
	total: number;
	threads: IMessage[];
	room: IRoom;
	unread?: string[];
	unreadUser?: string[];
	unreadGroup?: string[];
	userId?: IUser['_id'] | null;

	type: 'all' | 'following' | 'unread';
	setType: (type: string) => void;

	loading: boolean;

	error?: Error;

	text: string;
	setText: (text: string) => void;

	onClose: () => void;

	loadMoreItems: (min: number, max: number) => void;
};

export const ThreadList: FC<ThreadListProps> = function ThreadList({
	total = 10,
	threads = [],
	room,
	unread = [],
	unreadUser = [],
	unreadGroup = [],
	text,
	type,
	setType,
	loadMoreItems,
	loading,
	onClose,
	error,
	userId = '',
	setText,
}) {
	const showRealNames = Boolean(useSetting('UI_Use_Real_Name'));

	const t = useTranslation();
	const inputRef = useAutoFocus<HTMLInputElement>(true);
	const [name] = useCurrentRoute();

	if (!name) {
		throw new Error('No route name');
	}

	const channelRoute = useRoute(name);
	const onClick = useMutableCallback((e) => {
		const { id: context } = e.currentTarget.dataset;
		channelRoute.push({
			tab: 'thread',
			context,
			rid: room._id,
			...(room.name && { name: room.name }),
		});
	});

	const options: [string, string][] = useMemo(
		() => [
			['all', t('All')],
			['following', t('Following')],
			['unread', t('Unread')],
		],
		[t],
	);

	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

	const mid = useTabContext();
	const jump = useQueryStringParameter('jump');

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='thread' />
				<VerticalBar.Text>{t('Threads')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClose} />
			</VerticalBar.Header>

			<VerticalBar.Content paddingInline={0} ref={ref}>
				<Box
					display='flex'
					flexDirection='row'
					p='x24'
					borderBlockEndWidth='x2'
					borderBlockEndStyle='solid'
					borderBlockEndColor='neutral-200'
					flexShrink={0}
				>
					<Box display='flex' flexDirection='row' flexGrow={1} mi='neg-x4'>
						<Margins inline='x4'>
							<TextInput
								placeholder={t('Search_Messages')}
								value={text}
								onChange={setText as any}
								addon={<Icon name='magnifier' size='x20' />}
								ref={inputRef}
							/>
							<Select flexGrow={0} width='110px' onChange={setType} value={type} options={options} />
						</Margins>
					</Box>
				</Box>

				{loading && (
					<Box pi='x24' pb='x12'>
						<Throbber size='x12' />
					</Box>
				)}

				{error && (
					<Callout mi='x24' type='danger'>
						{error.toString()}
					</Callout>
				)}

				{!loading && total === 0 && (
					<Box p='x24' color='neutral-600' textAlign='center' width='full'>
						{t('No_Threads')}
					</Box>
				)}

				<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
					{!error && total > 0 && threads.length > 0 && (
						<Virtuoso
							style={{
								height: blockSize,
								width: inlineSize,
							}}
							totalCount={total}
							endReached={loading ? (): void => undefined : (start): unknown => loadMoreItems(start, Math.min(50, total - start))}
							overscan={25}
							data={threads}
							components={{ Scroller: ScrollableContentWrapper as any }}
							itemContent={(_index, data: IMessage): FC<IMessage> =>
								(
									<ThreadRow
										thread={data}
										showRealNames={showRealNames}
										unread={unread}
										unreadUser={unreadUser}
										unreadGroup={unreadGroup}
										userId={userId || ''}
										onClick={onClick}
									/>
								) as unknown as FC<IMessage>
							}
						/>
					)}
				</Box>
			</VerticalBar.Content>

			{typeof mid === 'string' && (
				<VerticalBar.InnerContent>
					<ThreadComponent onClickBack={onClick} mid={mid} jump={jump} room={room} />
				</VerticalBar.InnerContent>
			)}
		</>
	);
};

export default withData(ThreadList);
