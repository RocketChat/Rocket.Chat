import type { IGroupVideoConference } from '@rocket.chat/core-typings';
import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, ButtonGroup, Button, Icon } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../components/VerticalBar';
import { getErrorMessage } from '../../../lib/errorHandling';
import OutlookEventItem from './OutlookEventItem';

type OutlookEventsListProps = {
	onClose: () => void;
	onChangeRoute: () => void;
	total: number;
	videoConfs: IGroupVideoConference[];
	loading: boolean;
	error?: Error;
	reload: () => void;
	loadMoreItems: (min: number, max: number) => void;
};

const calendarEvents = [
	{
		title: 'Mobile messages THIS',
		subTitle: 'Wednesday, October 5, 9:00 - 9:30 AM ',
		content:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus molestie, urna vel sagittis sodales, libero tortor efficitur nisl, at porta dolor libero vel leo. Etiam malesuada massa id tellus aliquet rhoncus. Cras id scelerisque turpis. Sed interdum urna nec varius blandit. Nam tincidunt massa massa, eu sagittis metus imperdiet lobortis. Suspendisse urna lorem, volutpat non commodo eu, lacinia nec eros. Vivamus eget tincidunt nisl, sit amet cursus leo. Sed eu rhoncus orci. Praesent eu accumsan ante, vel ultricies elit. Cras vitae lorem vel odio vehicula sollicitudin. Nunc faucibus turpis mi, ac dapibus libero porttitor sit amet. Aliquam lacinia fringilla nulla vel ultricies.',
		link: '#',
	},
	{
		title: 'Mobile messages',
		subTitle: 'Wednesday, October 5, 9:00 - 9:30 AM ',
		link: '#',
	},
	{
		title: 'Mobile messages',
		subTitle: 'Wednesday, October 5, 9:00 - 9:30 AM ',
		link: '#',
	},
	{
		title: 'Mobile messages',
		subTitle: 'Wednesday, October 5, 9:00 - 9:30 AM ',
		link: '#',
	},
	{
		title: 'Mobile messages',
		subTitle: 'Wednesday, October 5, 9:00 - 9:30 AM ',
		link: '#',
	},
	{
		title: 'Mobile messages',
		subTitle: 'Wednesday, October 5, 9:00 - 9:30 AM ',
		link: '#',
	},
	{
		title: 'Mobile messages',
		subTitle: 'Wednesday, October 5, 9:00 - 9:30 AM ',
		link: '#',
	},
	{
		title: 'Mobile messages',
		subTitle: 'Wednesday, October 5, 9:00 - 9:30 AM ',
		link: '#',
	},
	{
		title: 'Mobile messages',
		subTitle: 'Wednesday, October 5, 9:00 - 9:30 AM ',
		link: '#',
	},
	{
		title: 'Mobile messages',
		subTitle: 'Wednesday, October 5, 9:00 - 9:30 AM ',
		link: '#',
	},
	{
		title: 'Mobile messages',
		subTitle: 'Wednesday, October 5, 9:00 - 9:30 AM ',
		link: '#',
	},
	{
		title: 'Mobile messages',
		subTitle: 'Wednesday, October 5, 9:00 - 9:30 AM ',
		link: '#',
	},
];

const OutlookEventsList = ({
	onClose,
	onChangeRoute,
	total = calendarEvents.length,
	loading,
	error,
	reload,
	loadMoreItems,
}: OutlookEventsListProps): ReactElement => {
	const t = useTranslation();

	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

	if (loading) {
		return <VerticalBar.Skeleton />;
	}

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='calendar' />
				<VerticalBar.Text>{t('Outlook_calendar')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClose} />
			</VerticalBar.Header>

			<VerticalBar.Content paddingInline={0} ref={ref} color='default'>
				{(total === 0 || error) && (
					<Box display='flex' flexDirection='column' justifyContent='center' height='100%'>
						{error && (
							<States>
								<StatesIcon name='circle-exclamation' variation='danger' />
								<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
								<StatesSubtitle>{getErrorMessage(error)}</StatesSubtitle>
							</States>
						)}
						{!error && total === 0 && (
							<States>
								<StatesIcon name='calendar' />
								<StatesTitle>{t('No_history')}</StatesTitle>
								{/* <StatesSubtitle>{t('There_is_no_video_conference_history_in_this_room')}</StatesSubtitle> */}
							</States>
						)}
					</Box>
				)}
				{calendarEvents.length > 0 && (
					<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
						<Virtuoso
							style={{
								height: blockSize,
								width: inlineSize,
							}}
							totalCount={total}
							endReached={(start): unknown => loadMoreItems(start, Math.min(50, total - start))}
							overscan={25}
							data={calendarEvents}
							components={{ Scroller: ScrollableContentWrapper as any }}
							itemContent={(_index, calendarData): ReactElement => <OutlookEventItem calendarData={calendarData} reload={reload} />}
						/>
					</Box>
				)}
			</VerticalBar.Content>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button onClick={onChangeRoute}>{t('Calendar_settings')}</Button>
					<Button>
						<Icon mie='x4' name='new-window' />
						<Box is='span'>{t('Open_Outlook')}</Box>
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default OutlookEventsList;
