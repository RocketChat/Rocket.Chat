import type { VideoConference } from '@rocket.chat/core-typings';
import { States, StatesIcon, StatesTitle, StatesSubtitle, Throbber } from '@rocket.chat/fuselage';
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
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import VideoConfListItem from './VideoConfListItem';
import CallHistoryState from './layout/CallHistoryState';
import ContextualbarInset from '../../../../../components/ContextualbarInset';
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
				{loading && (
					<ContextualbarInset block='x12'>
						<Throbber size='x12' />
					</ContextualbarInset>
				)}
				{(total === 0 || error) && (
					<CallHistoryState>
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
					</CallHistoryState>
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
