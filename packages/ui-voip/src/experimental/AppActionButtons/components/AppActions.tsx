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
				<Button
					size='medium'
					key={action.key}
					variant={action.variant === 'danger' ? 'danger' : undefined}
					disabled={action.disabled}
					onClick={action.onClick}
				>
					{action.label}
				</Button>
			))}
		</ButtonGroup>
	);
};

export default AppActions;
