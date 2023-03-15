import type { IDiscussionMessage, IUser } from '@rocket.chat/core-typings';
import { Box, Icon, TextInput, Callout, Throbber } from '@rocket.chat/fuselage';
import { useResizeObserver, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { RefObject } from 'react';
import React, { useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../../components/VerticalBar';
import { goToRoomById } from '../../../../lib/utils/goToRoomById';
import DiscussionsListRow from './DiscussionsListRow';

type DiscussionsListProps = {
	total: number;
	discussions: Array<IDiscussionMessage>;
	loadMoreItems: (start: number, end: number) => void;
	loading: boolean;
	onClose: () => void;
	error: unknown;
	userId: IUser['_id'];
	text: string;
	onChangeFilter: (e: unknown) => void;
};

function DiscussionsList({
	total = 10,
	discussions = [],
	loadMoreItems,
	loading,
	onClose,
	error,
	userId,
	text,
	onChangeFilter,
}: DiscussionsListProps) {
	const showRealNames = Boolean(useSetting('UI_Use_Real_Name'));

	const t = useTranslation();
	const inputRef = useAutoFocus(true);
	const onClick = useCallback((e) => {
		const { drid } = e.currentTarget.dataset;
		goToRoomById(drid);
	}, []);
	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});
	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='discussion' />
				<Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'>
					{t('Discussions')}
				</Box>
				<VerticalBar.Close onClick={onClose} />
			</VerticalBar.Header>

			<VerticalBar.Content paddingInline={0} ref={ref}>
				<Box
					display='flex'
					flexDirection='row'
					p='x24'
					borderBlockEndWidth='default'
					borderBlockEndStyle='solid'
					borderBlockEndColor='extra-light'
					flexShrink={0}
				>
					<TextInput
						placeholder={t('Search_Messages')}
						value={text}
						onChange={onChangeFilter}
						ref={inputRef as RefObject<HTMLInputElement>}
						addon={<Icon name='magnifier' size='x20' />}
					/>
				</Box>

				{loading && (
					<Box pi='x24' pb='x12'>
						<Throbber size='x12' />
					</Box>
				)}

				{error instanceof Error && (
					<Callout mi='x24' type='danger'>
						{error.toString()}
					</Callout>
				)}

				{!loading && total === 0 && (
					<Box width='full' textAlign='center' p='x24' color='annotation'>
						{t('No_Discussions_found')}
					</Box>
				)}

				<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
					{!error && total > 0 && discussions.length > 0 && (
						<Virtuoso
							style={{
								height: blockSize,
								width: inlineSize,
								overflow: 'hidden',
							}}
							totalCount={total}
							endReached={loading ? () => undefined : (start) => loadMoreItems(start, Math.min(50, total - start))}
							overscan={25}
							data={discussions}
							components={{ Scroller: ScrollableContentWrapper }}
							itemContent={(_, data) => (
								<DiscussionsListRow discussion={data} showRealNames={showRealNames} userId={userId} onClick={onClick} />
							)}
						/>
					)}
				</Box>
			</VerticalBar.Content>
		</>
	);
}

export default DiscussionsList;
