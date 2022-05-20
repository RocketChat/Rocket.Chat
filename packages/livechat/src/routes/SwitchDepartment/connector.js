import { Consumer } from '../../store';
import SwitchDepartmentContainer from './container';

const SwitchDepartmentConnector = ({ ref, ...props }) => (
	<Consumer>
		{({
			config: {
				departments = {},
				theme: {
					color,
				} = {},
			} = {},
			iframe: {
				theme: {
					color: customColor,
					fontColor: customFontColor,
					iconColor: customIconColor,
				} = {},
			} = {},
			room,
			loading = false,
			department,
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
				departments={departments.filter((dept) => dept.showOnRegistration && dept._id !== department)}
				dispatch={dispatch}
				room={room}
				alerts={alerts}
				token={token}
			/>
		)}
	</Consumer>
);

export default SwitchDepartmentConnector;
