import { Box } from '@rocket.chat/fuselage';

import { UserActivityText, useUserActivities } from '../../../../components/UserActivity';

export type ComposerUserActionIndicatorProps = { rid: string; tmid?: string };

const ComposerUserActionIndicator = ({ rid, tmid }: ComposerUserActionIndicatorProps) => {
	const activities = useUserActivities(rid, tmid);

	return (
		<Box
			role='status'
			height='x20'
			className='rc-message-box__activity-wrapper'
			fontScale='c1'
			color='annotation'
			display='flex'
			alignItems='center'
		>
			<UserActivityText activities={activities} />
		</Box>
	);
};

export default ComposerUserActionIndicator;
