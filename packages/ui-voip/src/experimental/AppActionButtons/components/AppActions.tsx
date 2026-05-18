import { ButtonGroup, Divider } from '@rocket.chat/fuselage';

import { useVisibleAppActions } from '../hooks/useVisibleAppActions';

const AppActions = () => {
	const visibleActions = useVisibleAppActions();

	if (visibleActions.length === 0) {
		return null;
	}

	return (
		<>
			<ButtonGroup vertical stretch>
				{visibleActions}
			</ButtonGroup>
			<Divider />
		</>
	);
};

export default AppActions;
