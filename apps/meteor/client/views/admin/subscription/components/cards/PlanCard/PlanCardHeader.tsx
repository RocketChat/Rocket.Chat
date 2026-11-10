import { CardTitle, CardHeader, Icon } from '@rocket.chat/fuselage';

export type PlanCardHeaderProps = { name: string };

const PlanCardHeader = ({ name }: PlanCardHeaderProps) => {
	return (
		<CardHeader>
			<Icon name='rocketchat' color='danger' size='x28' />
			<CardTitle variant='h3'>{name}</CardTitle>
		</CardHeader>
	);
};

export default PlanCardHeader;
