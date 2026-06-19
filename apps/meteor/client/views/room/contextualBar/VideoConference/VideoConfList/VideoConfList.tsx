import type { VideoConference } from '@rocket.chat/core-typings';
import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, Throbber } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import {
	VirtualizedScrollbars,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarEmptyContent,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GroupedVirtuoso } from 'react-virtuoso';

import VideoConfListItem from './VideoConfListItem';
import { VideoConfSectionDivider } from './VideoConfSectionDivider';
import InfiniteListAnchor from '../../../../../components/InfiniteListAnchor';
import { getErrorMessage } from '../../../../../lib/errorHandling';

type VideoConfListProps = {
	onClose: () => void;
	total: number;
	videoConfs: VideoConference[];
	loading: boolean;
	error?: Error;
	reload: () => void;
	loadMoreItems: () => void;
};

const VideoConfList = ({ onClose, total, videoConfs, loading, error, reload, loadMoreItems }: VideoConfListProps) => {
	const { t } = useTranslation();

	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

	const { groups, flatItems } = useMemo(() => {
		const ongoingCalls = videoConfs.filter((c) => !c.endedAt);
		const pastCalls = videoConfs.filter((c) => c.endedAt);

		const groups = [
			...(ongoingCalls.length > 0 ? [{ titleKey: 'Ongoing_calls' as const, count: ongoingCalls.length, items: ongoingCalls }] : []),
			...(pastCalls.length > 0 ? [{ titleKey: 'Past_calls' as const, count: pastCalls.length, items: pastCalls }] : []),
		];

		return { groups, flatItems: groups.flatMap((g) => g.items) };
	}, [videoConfs]);

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='history' />
				<ContextualbarTitle>{t('Conference_call_history')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarContent paddingInline={0} ref={ref}>
				{loading && (
					<Box pi={24} pb={12}>
						<Throbber size='x12' />
					</Box>
				)}
				{total === 0 && error && (
					<Box display='flex' flexDirection='column' justifyContent='center' height='100%'>
						{error && (
							<States>
								<StatesIcon name='circle-exclamation' variation='danger' />
								<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
								<StatesSubtitle>{getErrorMessage(error)}</StatesSubtitle>
							</States>
						)}
						{!error && !loading && total === 0 && (
							<ContextualbarEmptyContent
								icon='phone'
								title={t('No_history')}
								subtitle={t('There_is_no_video_conference_history_in_this_room')}
							/>
						)}
					</Box>
				)}
				<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
					{flatItems.length > 0 && (
						<VirtualizedScrollbars>
							<GroupedVirtuoso
								style={{
									height: blockSize,
									width: inlineSize,
								}}
								groupCounts={groups.map((g) => g.count)}
								groupContent={(index) => <VideoConfSectionDivider title={t(groups[index].titleKey)} count={groups[index].count} />}
								// eslint-disable-next-line react/no-multi-comp
								components={{ Footer: () => <InfiniteListAnchor loadMore={loadMoreItems} /> }}
								itemContent={(index) => <VideoConfListItem videoConfData={flatItems[index]} reload={reload} />}
							/>
						</VirtualizedScrollbars>
					)}
				</Box>
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default VideoConfList;
