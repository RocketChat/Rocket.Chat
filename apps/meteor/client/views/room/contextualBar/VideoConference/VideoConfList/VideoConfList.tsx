import type { VideoConference } from '@rocket.chat/core-typings';
import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, Throbber } from '@rocket.chat/fuselage';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarEmptyContent,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import VideoConfListItem from './VideoConfListItem';
import { PaginatedVirtualList } from '../../../../../components/PaginatedVirtualList';
import { getErrorMessage } from '../../../../../lib/errorHandling';

type VideoConfListProps = {
	onClose: () => void;
	total: number;
	videoConfs: VideoConference[];
	loading: boolean;
	error?: Error;
	reload: () => void;
	loadMoreItems: UseInfiniteQueryResult['fetchNextPage'];
};

const VideoConfList = ({ onClose, total, videoConfs, loading, error, reload, loadMoreItems }: VideoConfListProps) => {
	const { t } = useTranslation();

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='phone' />
				<ContextualbarTitle>{t('Calls')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarContent paddingInline={0}>
				{loading && (
					<Box pi={24} pb={12}>
						<Throbber size='x12' />
					</Box>
				)}
				{(total === 0 || error) && (
					<Box display='flex' flexDirection='column' justifyContent='center' height='100%'>
						{error && (
							<States>
								<StatesIcon name='circle-exclamation' variation='danger' />
								<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
								<StatesSubtitle>{getErrorMessage(error)}</StatesSubtitle>
							</States>
						)}
						{!loading && total === 0 && (
							<ContextualbarEmptyContent
								icon='phone'
								title={t('No_history')}
								subtitle={t('There_is_no_video_conference_history_in_this_room')}
							/>
						)}
					</Box>
				)}
				<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex' style={{ minHeight: 0 }}>
					{videoConfs.length > 0 && (
						<Box h='full' w='full' style={{ minHeight: 0 }}>
							<PaginatedVirtualList
								items={videoConfs}
								totalCount={total}
								overscan={25}
								onEndReached={loadMoreItems}
								renderItem={(data) => <VideoConfListItem videoConfData={data} reload={reload} />}
							/>
						</Box>
					)}
				</Box>
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default VideoConfList;
