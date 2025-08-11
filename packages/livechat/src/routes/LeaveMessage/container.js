import { Component } from 'preact';

import { Livechat } from '../../api';
import { ModalManager } from '../../components/Modal';
import { parseOfflineMessage } from '../../components/helpers';
import { parentCall } from '../../lib/parentCall';
import { alertTimeOut, createToken } from '../../lib/random';
import { Consumer } from '../../store';
import LeaveMessage from './component';
import { getWidgetDepartmentId, getWidgetOfflineEmail } from '../../store/Store';

export class LeaveMessageContainer extends Component {
	handleSubmit = async (fields) => {
		const { alerts, dispatch, successMessage } = this.props;

		await dispatch({ loading: true });
		try {
			const payload = parseOfflineMessage(fields);
			const text = await Livechat.sendOfflineMessage({
				...payload,
				department: getWidgetDepartmentId(),
				widgetEmail: getWidgetOfflineEmail(),
			});
			await ModalManager.alert({
				text: successMessage || text,
			});
			parentCall('callback', ['offline-form-submit', fields]);
			return true;
		} catch (error) {
			const message = error?.data?.error ?? error.message;

			const alert = { id: createToken(), children: message, error: true, timeout: alertTimeOut };
			await dispatch({ alerts: [...alerts, alert] });
			return false;
		} finally {
			await dispatch({ loading: false });
		}
	};

	render = (props) => <LeaveMessage {...props} onSubmit={this.handleSubmit} />;
}

export const LeaveMessageConnector = ({ ref, ...props }) => (
	<Consumer>
		{({
			config: {
				departments = {},
				messages: { offlineMessage: message, offlineSuccessMessage: successMessage, offlineUnavailableMessage: unavailableMessage } = {},
				theme: { offlineTitle: title, offlineColor: color } = {},
				settings: { displayOfflineForm } = {},
			} = {},
			iframe: { theme: { offlineTitle: customOfflineTitle } = {} } = {},
			loading,
			token,
			dispatch,
			alerts,
		}) => (
			<LeaveMessageContainer
				ref={ref}
				{...props}
				theme={{
					color,
					offlineTitle: customOfflineTitle,
				}}
				title={customOfflineTitle || title}
				message={message}
				successMessage={successMessage}
				unavailableMessage={unavailableMessage}
				loading={loading}
				token={token}
				dispatch={dispatch}
				alerts={alerts}
				hasForm={displayOfflineForm}
				hasDepartmentField={departments && departments.some((dept) => dept.showOnOfflineForm)}
				departments={departments.filter((dept) => dept.showOnOfflineForm)}
			/>
		)}
	</Consumer>
);

export default LeaveMessageConnector;
