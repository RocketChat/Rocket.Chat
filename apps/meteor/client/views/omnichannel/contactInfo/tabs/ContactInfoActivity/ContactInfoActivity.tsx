import { Box, States, StatesAction, StatesActions, StatesIcon, StatesTitle, Throbber } from '@rocket.chat/fuselage';
import { useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import ActivityListItem from './ActivityListItem';
import { useActivityList } from './useActivityList';
import { ContextualbarContent, ContextualbarEmptyContent } from '../../../../../components/Contextualbar';
import { VirtualizedScrollbars } from '../../../../../components/CustomScrollbars';

const ContactInfoActivity = () => {
	const { t } = useTranslation();

	const { data: activities, isError, isPending, refetch } = useActivityList();

	const messageId = useRouteParameter('messageId');
	console.log('messageId', messageId);

	const handleClickItem = (activity: ComponentProps<typeof ActivityListItem>) => {
		console.log('clicked activity', activity);
	};

	if (isPending) {
		return (
			<ContextualbarContent>
				<Box pb={12}>
					<Throbber size='x12' />
				</Box>
			</ContextualbarContent>
		);
	}

	if (isError) {
		return (
			<ContextualbarContent paddingInline={0} justifyContent='center'>
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesActions>
						<StatesAction onClick={refetch}>{t('Retry')}</StatesAction>
					</StatesActions>
				</States>
			</ContextualbarContent>
		);
	}

	return (
		<ContextualbarContent paddingInline={0}>
			{activities?.length === 0 && (
				<ContextualbarEmptyContent icon='balloon' title={t('No_activity_yet')} subtitle={t('No_activity_yet_description')} />
			)}

			<Box role='list' mbs={16} flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
				<VirtualizedScrollbars>
					<Virtuoso
						totalCount={activities.length}
						overscan={25}
						data={activities}
						itemContent={(index, activity) => <ActivityListItem key={index} {...activity} onClick={() => handleClickItem(activity)} />}
					/>
				</VirtualizedScrollbars>
			</Box>
		</ContextualbarContent>
	);
};

export default ContactInfoActivity;
