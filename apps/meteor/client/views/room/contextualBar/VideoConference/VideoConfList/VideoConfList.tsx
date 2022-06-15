import { IRoom } from '@rocket.chat/core-typings';
import { Box, Callout, Throbber, States, StatesIcon, StatesTitle, StatesSubtitle } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../../../components/VerticalBar';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { useTabBarClose } from '../../../providers/ToolboxProvider';
import VideoConfListItem from './VideoConfListItem';

const VideoConfList = ({ rid }: { rid: IRoom['_id'] }): ReactElement => {
	const t = useTranslation();
	const onClose = useTabBarClose();

	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

	const query = useMemo(() => ({ roomId: rid }), [rid]);
	const { value, phase } = useEndpointData('/v1/video-conference.list', query);

	const total = value?.total || 0;
	const videoconfs = value?.data || [];

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='video' />
				<VerticalBar.Text>{t('Video_Conferences')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClose} />
			</VerticalBar.Header>

			<VerticalBar.Content paddingInline={0} ref={ref}>
				{phase === AsyncStatePhase.LOADING && (
					<Box pi='x24' pb='x12'>
						<Throbber size='x12' />
					</Box>
				)}

				{phase === AsyncStatePhase.REJECTED && (
					<Callout mi='x24' type='danger'>
						{/* {error.toString()} */}
					</Callout>
				)}

				{phase === AsyncStatePhase.RESOLVED && total === 0 && (
					<Box display='flex' flexDirection='column' justifyContent='center' height='100%'>
						<States>
							<StatesIcon name='video' />
							<StatesTitle>No conference history</StatesTitle>
							<StatesSubtitle>There was no conference call history in this room</StatesSubtitle>
						</States>
					</Box>
				)}

				{phase === AsyncStatePhase.RESOLVED && videoconfs.length > 0 && (
					<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
						<Virtuoso
							style={{
								height: blockSize,
								width: inlineSize,
							}}
							totalCount={total}
							// endReached={loading ? (): void => undefined : (start): unknown => loadMoreItems(start, Math.min(50, total - start))}
							overscan={25}
							data={videoconfs}
							components={{ Scroller: ScrollableContentWrapper as any }}
							itemContent={(_index, data): ReactElement => (
								<VideoConfListItem
									videoConfData={data}
									// showRealNames={showRealNames}
									// unread={unread}
									// unreadUser={unreadUser}
									// unreadGroup={unreadGroup}
									// userId={userId || ''}
									// onClick={onClick}
								/>
							)}
						/>
					</Box>
				)}
			</VerticalBar.Content>
		</>
	);
};

export default VideoConfList;
