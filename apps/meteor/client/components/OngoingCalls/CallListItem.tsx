import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Extended from '../../sidebar/Item/Extended';

type CallListItemProps = {
	call: JoinableVideoConference;
	timeLabel?: ReactNode;
	actions: ReactNode;
	onOpen: () => void;
};

const CallListItem = ({ call, timeLabel, actions, onOpen }: CallListItemProps) => {
	const { t } = useTranslation();

	return (
		<Extended
			onClick={(event) => {
				event.preventDefault();

				if ((event.target as HTMLElement).closest('button')) {
					return;
				}

				onOpen();
			}}
			icon={<Icon name='video' size='x16' />}
			title={call.name}
			time={call.createdAt}
			timeLabel={timeLabel}
			subtitle={
				<Box fontScale='micro' color='hint'>
					{t('__count__people_joined', { count: call.usersCount })}
				</Box>
			}
			actions={actions}
		/>
	);
};

export default CallListItem;
