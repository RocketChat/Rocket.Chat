import { CardTitle, CardHeader, StatusIcon } from '@rocket.chat/fuselage';

export type PlanCardHeaderProps = { name: string };

const PlanCardHeader = ({ name }: PlanCardHeaderProps) => {
	return (
		<CardHeader>
			<StatusIcon name='rocketchat' status='danger' size='x28' />
			<CardTitle variant='h3'>{name}</CardTitle>
		</CardHeader>
	);
};

export default PlanCardHeader;
