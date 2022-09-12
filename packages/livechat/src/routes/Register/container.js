import { Component } from 'preact';
import { route } from 'preact-router';

import { Livechat } from '../../api';
import CustomFields from '../../lib/customFields';
import { parentCall } from '../../lib/parentCall';
import { Consumer } from '../../store';
import Register from './component';

export class RegisterContainer extends Component {
	registerCustomFields(customFields = {}) {
		Object.entries(customFields).forEach(([key, value]) => {
			if (!value || value === '') {
				return;
			}

			CustomFields.setCustomField(key, value, true);
		});
	}

	getDepartment = (department) => {
		if (department !== '') {
			return department;
		}

		const { departments = {} } = this.props;
		const deptDefault = departments.find((dept) => dept.showOnRegistration);

		if (deptDefault) {
			return deptDefault._id;
		}
	};

	handleSubmit = async ({ name, email, department, ...customFields }) => {
		const { dispatch, token } = this.props;
		const fields = {
			name,
			email,
			department: this.getDepartment(department),
		};

		await dispatch({ loading: true, department });
		try {
			const user = await Livechat.grantVisitor({ visitor: { ...fields, token } });
			await dispatch({ user });
			parentCall('callback', ['pre-chat-form-submit', fields]);
			this.registerCustomFields(customFields);
		} finally {
			await dispatch({ loading: false });
		}
	};

	getDepartmentDefault() {
		const { guestDepartment, departments } = this.props;
		if (departments && departments.some((dept) => dept._id === guestDepartment)) {
			return guestDepartment;
		}
	}

	componentDidUpdate(prevProps) {
		const { user: prevUser } = prevProps;
		const { user } = this.props;

		if ((!prevUser || Object.keys(prevUser).length === 0) && user && user._id) {
			route('/');
		}
	}

	render = (props) => <Register {...props} onSubmit={this.handleSubmit} departmentDefault={this.getDepartmentDefault()} />;
}

export const RegisterConnector = ({ ref, ...props }) => (
	<Consumer>
		{({
			config: {
				departments = {},
				messages: { registrationFormMessage: message } = {},
				settings: { nameFieldRegistrationForm: hasNameField, emailFieldRegistrationForm: hasEmailField } = {},
				theme: { title, color } = {},
				customFields = [],
			} = {},
			iframe: {
				guest: { department: guestDepartment, name: guestName, email: guestEmail } = {},
				theme: { color: customColor, fontColor: customFontColor, iconColor: customIconColor, title: customTitle } = {},
			} = {},
			loading = false,
			token,
			dispatch,
			user,
		}) => (
			<RegisterContainer
				ref={ref}
				{...props}
				theme={{
					color: customColor || color,
					fontColor: customFontColor,
					iconColor: customIconColor,
					title: customTitle,
				}}
				title={customTitle || title}
				message={message}
				hasNameField={hasNameField}
				hasEmailField={hasEmailField}
				hasDepartmentField={departments && departments.some((dept) => dept.showOnRegistration)}
				departments={departments.filter((dept) => dept.showOnRegistration)}
				nameDefault={guestName}
				emailDefault={guestEmail}
				guestDepartment={guestDepartment}
				loading={loading}
				token={token}
				dispatch={dispatch}
				user={user}
				customFields={customFields}
			/>
		)}
	</Consumer>
);

export default RegisterConnector;
