import type { ComponentProps } from 'preact';

import { Consumer } from '../../store';
import SwitchDepartmentContainer from './container';

type SwitchDepartmentConnectorProps = Omit<
	ComponentProps<typeof SwitchDepartmentContainer>,
	'theme' | 'loading' | 'iframe' | 'departments' | 'dispatch' | 'room' | 'alerts' | 'token'
>;

const SwitchDepartmentConnector = ({ ref, ...props }: SwitchDepartmentConnectorProps) => (
	<Consumer>
		{({
			config: { departments = [], theme: { color } = {} } = {},
			iframe: { theme: { color: customColor, fontColor: customFontColor, iconColor: customIconColor } = {}, guest } = {},
			iframe,
			room,
			loading = false,
			dispatch,
			alerts,
			token,
		}) => (
			<SwitchDepartmentContainer
				ref={ref}
				{...props}
				theme={{
					color: customColor || color,
					fontColor: customFontColor,
					iconColor: customIconColor,
				}}
				loading={loading}
				iframe={iframe}
				departments={departments.filter((dept) => dept.showOnRegistration && dept._id !== guest?.department)}
				dispatch={dispatch}
				room={room}
				alerts={alerts}
				token={token}
			/>
		)}
	</Consumer>
);

export default SwitchDepartmentConnector;
