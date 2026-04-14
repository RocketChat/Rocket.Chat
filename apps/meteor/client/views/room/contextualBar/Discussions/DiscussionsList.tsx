import type { IDiscussionMessage } from '@rocket.chat/core-typings';
import { Box, Icon, TextInput, Callout, Throbber } from '@rocket.chat/fuselage';
import { useResizeObserver, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import {
	VirtualizedScrollbars,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarContent,
	ContextualbarClose,
	ContextualbarEmptyContent,
	ContextualbarTitle,
	ContextualbarSection,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, MouseEvent, RefObject } from 'react';
import { useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import DiscussionsListRow from './DiscussionsListRow';
import ResultsLiveRegion from '../../../../components/ResultsLiveRegion';
import { useGoToRoom } from '../../hooks/useGoToRoom';

type DiscussionsListProps = {
	itemCount: number;
	discussions: Array<IDiscussionMessage>;
	loadMoreItems: (start: number, end: number) => void;
	isPending: boolean;
	isSuccess: boolean;
	onClose: () => void;
	error: unknown;
	text: string;
	onChangeFilter: (e: ChangeEvent<HTMLInputElement>) => void;
};

function DiscussionsList({
	itemCount,
	discussions = [],
	loadMoreItems,
	isPending,
	isSuccess,
	onClose,
	error,
	text,
	onChangeFilter,
}: DiscussionsListProps) {
	const { t } = useTranslation();
	const discussionListId = useId();

	const showRealNames = useSetting('UI_Use_Real_Name', false);
	const inputRef = useAutoFocus(true);

	const goToRoom = useGoToRoom();

	const onClick = useCallback(
		(e: MouseEvent<HTMLElement>) => {
			const { drid } = e.currentTarget.dataset;
			if (drid) goToRoom(drid);
		},
		[goToRoom],
	);

	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='discussion' />
				<ContextualbarTitle>{t('Discussions')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarSection>
				<TextInput
					placeholder={t('Search_Messages')}
					aria-label={t('Search_Messages')}
					aria-controls={isSuccess ? discussionListId : undefined}
					value={text}
					onChange={onChangeFilter}
					ref={inputRef as RefObject<HTMLInputElement>}
					addon={<Icon name='magnifier' size='x20' />}
				/>
			</ContextualbarSection>
			<ContextualbarContent paddingInline={0} ref={ref}>
				<ResultsLiveRegion shouldAnnounce={isSuccess} itemCount={itemCount} />
				{isPending && (
					<Box pi={24} pb={12}>
						<Throbber size='x12' />
					</Box>
				)}
				{error instanceof Error && (
					<Callout mi={24} type='danger'>
						{error.toString()}
					</Callout>
				)}
				{isSuccess && (
					<Box id={discussionListId} w='full' h='full' overflow='hidden' flexShrink={1}>
						{discussions.length === 0 && <ContextualbarEmptyContent title={t('No_Discussions_found')} />}
						{discussions.length > 0 && (
							<VirtualizedScrollbars>
								<Virtuoso
									style={{
										height: blockSize,
										width: inlineSize,
									}}
									totalCount={itemCount}
									endReached={isPending ? () => undefined : (start) => loadMoreItems(start, Math.min(50, itemCount - start))}
									overscan={25}
									data={discussions}
									itemContent={(_, data) => <DiscussionsListRow discussion={data} showRealNames={showRealNames} onClick={onClick} />}
								/>
							</VirtualizedScrollbars>
						)}
					</Box>
				)}
			</ContextualbarContent>
		</ContextualbarDialog>
	);
}

export default DiscussionsList;
