import type { VideoConference } from '@rocket.chat/core-typings';
import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, Throbber } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import VideoConfListItem from './VideoConfListItem';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarEmptyContent,
} from '../../../../../components/Contextualbar';
import { VirtualizedScrollbars } from '../../../../../components/CustomScrollbars';
import { getErrorMessage } from '../../../../../lib/errorHandling';

type VideoConfListProps = {
	onClose: () => void;
	total: number;
	videoConfs: VideoConference[];
	loading: boolean;
	error?: Error;
	reload: () => void;
	loadMoreItems: (min: number, max: number) => void;
};

const VideoConfList = ({ onClose, total, videoConfs, loading, error, reload, loadMoreItems }: VideoConfListProps): ReactElement => {
	const { t } = useTranslation();

	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='phone' />
				<ContextualbarTitle>{t('Calls')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>

			<ContextualbarContent paddingInline={0} ref={ref}>
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
				<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
					{videoConfs.length > 0 && (
						<VirtualizedScrollbars>
							<Virtuoso
								style={{
									height: blockSize,
									width: inlineSize,
								}}
								totalCount={total}
								endReached={
									loading
										? (): void => undefined
										: (start) => {
												loadMoreItems(start, Math.min(50, total - start));
											}
								}
								overscan={25}
								data={videoConfs}
								itemContent={(_index, data): ReactElement => <VideoConfListItem videoConfData={data} reload={reload} />}
							/>
						</VirtualizedScrollbars>
					)}
				</Box>
			</ContextualbarContent>
		</>
	);
};

export default VideoConfList;
