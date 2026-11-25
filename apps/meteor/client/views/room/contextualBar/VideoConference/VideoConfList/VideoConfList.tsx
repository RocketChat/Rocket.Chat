import type { VideoConference } from '@rocket.chat/core-typings';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import {
	VirtualizedScrollbars,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarEmptyContent,
	ContextualbarSkeletonContent,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import VideoConfListItem from './VideoConfListItem';
import ListViewport from '../../../../../components/ListViewport';
import { getErrorMessage } from '../../../../../lib/errorHandling';

export type VideoConfListProps = {
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

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='phone' />
				<ContextualbarTitle>{t('Calls')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarContent flush ref={ref}>
				{loading && <ContextualbarSkeletonContent />}
				{error && (
					<ContextualbarEmptyContent
						icon='circle-exclamation'
						iconVariation='danger'
						title={t('Something_went_wrong')}
						subtitle={getErrorMessage(error)}
					/>
				)}
				{!error && !loading && total === 0 && (
					<ContextualbarEmptyContent
						icon='phone'
						title={t('No_history')}
						subtitle={t('There_is_no_video_conference_history_in_this_room')}
					/>
				)}
				<ListViewport>
					{videoConfs.length > 0 && (
						<VirtualizedScrollbars>
							<Virtuoso
								style={{
									height: blockSize,
									width: inlineSize,
								}}
								totalCount={total}
								endReached={loadMoreItems}
								overscan={25}
								data={videoConfs}
								itemContent={(_index, data) => <VideoConfListItem videoConfData={data} reload={reload} />}
							/>
						</VirtualizedScrollbars>
					)}
				</ListViewport>
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default VideoConfList;
