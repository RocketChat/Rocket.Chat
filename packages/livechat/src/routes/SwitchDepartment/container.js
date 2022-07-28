import { Component } from 'preact';
import { route } from 'preact-router';
import { withTranslation } from 'react-i18next';

import { Livechat } from '../../api';
import { ModalManager } from '../../components/Modal';
import { loadConfig } from '../../lib/main';
import { createToken } from '../../lib/random';
import SwitchDepartment from './component';

class SwitchDepartmentContainer extends Component {
	confirmChangeDepartment = async () => {
		const { i18n } = this.props;
		const result = await ModalManager.confirm({
			text: i18n.t('are_you_sure_you_want_to_switch_the_department'),
		});

		return typeof result.success === 'boolean' && result.success;
	};

	handleSubmit = async (fields) => {
		const { alerts, dispatch, room, token, t, guest, iframe } = this.props;
		const { department } = fields;

		const confirm = await this.confirmChangeDepartment();
		if (!confirm) {
			return;
		}

		if (!room) {
			const user = await Livechat.grantVisitor({ visitor: { department, token } });
			await dispatch({ user, alerts: (alerts.push({ id: createToken(), children: t('department_switched'), success: true }), alerts) });
			return route('/');
		}

		await dispatch({ loading: true });
		try {
			const { _id: rid } = room;
			const result = await Livechat.transferChat({ rid, department });
			const { success } = result;
			if (!success) {
				throw t('no_available_agents_to_transfer');
			}

			await dispatch({ iframe: { ...iframe, guest: { ...guest, department } }, loading: false });
			await loadConfig();

			await ModalManager.alert({
				text: t('department_switched'),
			});

			route('/');
		} catch (error) {
			console.error(error);
			await dispatch({ alerts: (alerts.push({ id: createToken(), children: t('no_available_agents_to_transfer'), warning: true }), alerts) });
		} finally {
			await dispatch({ loading: false });
		}
	};

	handleCancel = () => {
		route('/');
	};

	render = (props) => (
		<SwitchDepartment {...props} onSubmit={this.handleSubmit} onCancel={this.handleCancel} />
	);
}

export default withTranslation()(SwitchDepartmentContainer);
