import type { IMessage, ISubscription, IThreadMainMessage } from '@rocket.chat/core-typings';
import { Box, Icon, TextInput, Select, Callout, Throbber } from '@rocket.chat/fuselage';
import { useResizeObserver, useAutoFocus } from '@rocket.chat/fuselage-hooks';
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
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FormEvent } from 'react';
import { useId } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ThreadListItem from './components/ThreadListItem';
import ResultsLiveRegion from '../../../../components/ResultsLiveRegion';
import { getErrorMessage } from '../../../../lib/errorHandling';

type ThreadType = 'all' | 'following' | 'unread';

export type ThreadListViewProps = {
	searchText: string;
	handleSearchTextChange: (event: FormEvent<HTMLInputElement>) => void;
	typeOptions: (readonly [type: ThreadType, label: string])[];
	type: ThreadType;
	handleTypeChange: (type: string) => void;
	handleTabBarCloseButtonClick: () => void;
	isPending: boolean;
	error: Error | null;
	isSuccess: boolean;
	items: IThreadMainMessage[];
	itemCount: number;
	fetchNextPage: () => void;
	handleThreadClick: (tmid: IMessage['_id']) => void;
	subscription: ISubscription | undefined;
};

const ThreadListView = ({
	searchText,
	handleSearchTextChange,
	typeOptions,
	type,
	handleTypeChange,
	handleTabBarCloseButtonClick,
	isPending,
	error,
	isSuccess,
	items,
	itemCount,
	fetchNextPage,
	handleThreadClick,
	subscription,
}: ThreadListViewProps) => {
	const t = useTranslation();
	const threadListId = useId();
	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});
	const autoFocusRef = useAutoFocus<HTMLInputElement>(true);

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='thread' />
				<ContextualbarTitle>{t('Threads')}</ContextualbarTitle>
				<ContextualbarClose onClick={handleTabBarCloseButtonClick} />
			</ContextualbarHeader>
			<ContextualbarSection>
				<TextInput
					aria-label={t('Search_Messages')}
					aria-controls={isSuccess ? threadListId : undefined}
					placeholder={t('Search_Messages')}
					addon={<Icon name='magnifier' size='x20' />}
					ref={autoFocusRef}
					value={searchText}
					onChange={handleSearchTextChange}
				/>
				<Box w='x144' mis={8}>
					<Select
						aria-controls={isSuccess ? threadListId : undefined}
						options={typeOptions}
						value={type}
						onChange={(value) => handleTypeChange(String(value))}
					/>
				</Box>
			</ContextualbarSection>
			<ContextualbarContent paddingInline={0} ref={ref}>
				<ResultsLiveRegion shouldAnnounce={isSuccess} itemCount={itemCount} />
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
				{isSuccess && (
					<Box id={threadListId} w='full' h='full' overflow='hidden' flexShrink={1}>
						{items.length === 0 && <ContextualbarEmptyContent title={t('No_Threads')} />}
						{items.length > 0 && (
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
				)}
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default ThreadListView;
