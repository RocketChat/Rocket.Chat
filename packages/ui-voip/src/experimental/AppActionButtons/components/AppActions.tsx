import { Button, ButtonGroup } from '@rocket.chat/fuselage';

import type { VisibleAppAction } from '../hooks/useVisibleAppActions';

type AppActionsProps = {
	actions: VisibleAppAction[];
	vertical?: boolean;
};

const AppActions = ({ actions, vertical }: AppActionsProps) => {
	if (actions.length === 0) {
		return null;
	}

	return (
		<ButtonGroup vertical={vertical} stretch={vertical}>
			{actions.map((action) => (
				<Button medium key={action.key} danger={action.variant === 'danger'} disabled={action.disabled} onClick={action.onClick}>
					{action.label}
				</Button>
			))}
		</ButtonGroup>
	);
};

export default AppActions;
