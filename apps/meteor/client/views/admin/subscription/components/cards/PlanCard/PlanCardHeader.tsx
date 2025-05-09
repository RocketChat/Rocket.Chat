import { CardTitle, Icon, Palette, CardHeader } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

const PlanCardHeader = ({ name }: { name: string }): ReactElement => {
	return (
		<CardHeader>
			<Icon name='rocketchat' color={Palette.badge['badge-background-level-4'].toString()} size='x28' mie={4} />
			<CardTitle variant='h3'>{name}</CardTitle>
		</CardHeader>
	);
};

export default PlanCardHeader;
