import { Box, Icon, TextInput, Callout, Throbber } from '@rocket.chat/fuselage';
import { useResizeObserver, useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../../components/VerticalBar';
import { goToRoomById } from '../../../../lib/utils/goToRoomById';
import Row from './Row';
import { withData } from './withData';

function DiscussionList({ total = 10, discussions = [], loadMoreItems, loading, onClose, error, userId, text, setText }) {
	const showRealNames = useSetting('UI_Use_Real_Name');

	const t = useTranslation();
	const inputRef = useAutoFocus(true);
	const onClick = useCallback((e) => {
		const { drid } = e.currentTarget.dataset;
		goToRoomById(drid);
	}, []);
	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver({
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
					borderBlockEndWidth='x2'
					borderBlockEndStyle='solid'
					borderBlockEndColor='neutral-200'
					flexShrink={0}
				>
					<TextInput
						placeholder={t('Search_Messages')}
						value={text}
						onChange={setText}
						ref={inputRef}
						addon={<Icon name='magnifier' size='x20' />}
					/>
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
					<Box width='full' textAlign='center' p='x24' color='neutral-600'>
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
							endReached={loading ? () => {} : (start) => loadMoreItems(start, Math.min(50, total - start))}
							overscan={25}
							data={discussions}
							components={{ Scroller: ScrollableContentWrapper }}
							itemContent={(index, data) => <Row discussion={data} showRealNames={showRealNames} userId={userId} onClick={onClick} />}
						/>
					)}
				</Box>
			</VerticalBar.Content>
		</>
	);
}

export default withData(DiscussionList);
