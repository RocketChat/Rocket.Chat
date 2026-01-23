import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { Box, Icon, TextInput, Select, Callout, Throbber } from '@rocket.chat/fuselage';
import { useResizeObserver, useAutoFocus, useLocalStorage, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import {
	VirtualizedScrollbars,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarEmptyContent,
	ContextualbarSection,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import { useTranslation, useUserId, useRoomToolbox } from '@rocket.chat/ui-contexts';
import type { FormEvent } from 'react';
import { useMemo, useState, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ThreadListItem from './components/ThreadListItem';
import { useThreadsList } from './hooks/useThreadsList';
import { getErrorMessage } from '../../../../lib/errorHandling';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
import { useGoToThread } from '../../hooks/useGoToThread';

type ThreadType = 'all' | 'following' | 'unread';

const ThreadList = () => {
	const t = useTranslation();

	const { closeTab } = useRoomToolbox();

	const handleTabBarCloseButtonClick = useCallback(() => {
		closeTab();
	}, [closeTab]);

	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

	const autoFocusRef = useAutoFocus<HTMLInputElement>(true);

	const [searchText, setSearchText] = useState('');

	const handleSearchTextChange = useCallback(
		(event: FormEvent<HTMLInputElement>) => {
			setSearchText(event.currentTarget.value);
		},
		[setSearchText],
	);

	const typeOptions: (readonly [type: ThreadType, label: string])[] = useMemo(
		() => [
			['all', t('All')],
			['following', t('Following')],
			['unread', t('Unread')],
		],
		[t],
	);

	const [type, setType] = useLocalStorage<ThreadType>('thread-list-type', 'all');

	const handleTypeChange = useCallback(
		(type: string) => {
			const typeOption = typeOptions.find(([t]) => t === type);
			if (typeOption) setType(typeOption[0]);
		},
		[setType, typeOptions],
	);

	const room = useRoom();
	const rid = room._id;
	const subscription = useRoomSubscription();
	const subscribed = !!subscription;
	const uid = useUserId();
	const tunread = subscription?.tunread?.sort().join(',');
	const text = useDebouncedValue(searchText, 400);
	const options = useDebouncedValue(
		useMemo(() => {
			if (type === 'all' || !subscribed || !uid) {
				return {
					rid,
					text,
					type,
					uid,
				};
			case 'unread':
				return {
					rid,
					text,
					type,
					tunread: tunread?.split(','),
				};
		}
	}, [rid, subscribed, text, tunread, type, uid]);

	const { isPending, error, isSuccess, data, fetchNextPage } = useThreadsList(options);

	const items = data?.items || [];
	const itemCount = data?.itemCount ?? 0;

	const goToThread = useGoToThread({ replace: true });
	const handleThreadClick = useCallback(
		(tmid: IMessage['_id']) => {
			goToThread({ rid, tmid });
		},
		[rid, goToThread],
	);

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='thread' />
				<ContextualbarTitle>{t('Threads')}</ContextualbarTitle>
				<ContextualbarClose onClick={handleTabBarCloseButtonClick} />
			</ContextualbarHeader>
			<ContextualbarSection>
				<TextInput
					placeholder={t('Search_Messages')}
					addon={<Icon name='magnifier' size='x20' />}
					ref={autoFocusRef}
					value={searchText}
					onChange={handleSearchTextChange}
				/>
				<Box w='x144' mis={8}>
					<Select options={typeOptions} value={type} onChange={(value) => handleTypeChange(String(value))} />
				</Box>
			</ContextualbarSection>
			<ContextualbarContent paddingInline={0}>
				{isPending && (
					<Box pi={24} pb={12}>
						<Throbber size='x12' />
					</Box>
				)}

					{error && (
						<Callout mi={24} type='danger'>
							{getErrorMessage(error, t('Something_went_wrong'))}
						</Callout>
					)}

				{isSuccess && itemCount === 0 && <ContextualbarEmptyContent title={t('No_Threads')} />}

					{!error && itemCount > 0 && items.length > 0 && (
						<VirtualizedScrollbars>
							<Virtuoso
								style={{
									height: blockSize,
									width: inlineSize,
								}}
								totalCount={itemCount}
								endReached={() => fetchNextPage()}
								overscan={25}
								data={items}
								itemContent={(_index, data: IThreadMainMessage) => (
									<ThreadListItem
										thread={data}
										unread={subscription?.tunread ?? []}
										unreadUser={subscription?.tunreadUser ?? []}
										unreadGroup={subscription?.tunreadGroup ?? []}
										onClick={handleThreadClick}
									/>
								)}
							/>
						</VirtualizedScrollbars>
					)}
				</Box>
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default ThreadList;
