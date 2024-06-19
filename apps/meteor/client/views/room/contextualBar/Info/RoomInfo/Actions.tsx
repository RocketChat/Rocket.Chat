import type { Keys as IconKeys } from '@rocket.chat/icons';
import React from 'react';

import InfoPanel from '../../../../../components/InfoPanel';

type Action = {
	id: string;
	name: string;
	icon: IconKeys;
	action: () => void;
};

type ActionsProps = {
	actions: Action[];
	className?: string;
};

const Actions = ({ actions, className }: ActionsProps) => {
	return (
		<>
			{actions.map(({ id, name, icon, action }) => (
				<InfoPanel.Action className={className} key={id} label={name} onClick={action} icon={icon} />
			))}
		</>
	);
};

export default Actions;
