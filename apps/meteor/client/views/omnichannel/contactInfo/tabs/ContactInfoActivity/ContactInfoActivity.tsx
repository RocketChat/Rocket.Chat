import { Box, States, StatesAction, StatesActions, StatesIcon, StatesTitle, Throbber } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import ActivityListItem from './components/ActivityListItem';
import type { ActivityItem } from './useActivityList';
import { useActivityList } from './useActivityList';
import { ContextualbarContent, ContextualbarEmptyContent } from '../../../../../components/Contextualbar';
import { VirtualizedScrollbars } from '../../../../../components/CustomScrollbars';
import { useContactRoute } from '../../../hooks/useContactRoute';

const ContactInfoActivity = () => {
	const { t } = useTranslation();
	const handleNavigate = useContactRoute();

	const { data: activities, isError, isPending, refetch } = useActivityList();

	const handleClickItem = (activity: ActivityItem) => {
		handleNavigate({
			context: 'activity',
			contextId: activity.id,
		});
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
