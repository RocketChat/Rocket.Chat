import { Component } from 'preact';
import { withTranslation } from 'react-i18next';

import { Button } from '../../components/Button';
import { ButtonGroup } from '../../components/ButtonGroup';
import { Form, FormField, SelectInput, Validations } from '../../components/Form';
import Screen from '../../components/Screen';
import { createClassName } from '../../components/helpers';
import styles from './styles.scss';

class SwitchDepartment extends Component {
	static getDerivedStateFromProps(props, state) {
		if (props.departments && props.departments.length > 0 && !state.department) {
			return { department: { value: '' } };
		}

		if (!props.departments || props.departments.length === 0) {
			return { department: null };
		}

		return null;
	}

	state = {
		department: null,
	};

	validations = {
		department: [Validations.nonEmpty],
	};

	getValidableFields = () => Object.keys(this.validations)
		.map((fieldName) => (this.state[fieldName] ? { fieldName, ...this.state[fieldName] } : null))
		.filter(Boolean);

	validate = ({ name, value }) => this.validations[name].reduce((error, validation) => error || validation({ value }), undefined);

	validateAll = () => {
		for (const { fieldName: name, value } of this.getValidableFields()) {
			const error = this.validate({ name, value });
			this.setState({ [name]: { ...this.state[name], value, error, showError: false } });
		}
	};

	isValid = () => this.getValidableFields().every(({ error } = {}) => !error);

	handleFieldChange = (name) => ({ target: { value } }) => {
		const error = this.validate({ name, value });
		this.setState({ [name]: { ...this.state[name], value, error, showError: false } }, () => { this.validateAll(); });
	};

	handleDepartmentChange = this.handleFieldChange('department');

	handleSubmit = (event) => {
		event.preventDefault();

		if (this.props.onSubmit) {
			const values = Object.entries(this.state)
				.filter(([, state]) => state !== null)
				.map(([name, { value }]) => ({ [name]: value }))
				.reduce((values, entry) => ({ ...values, ...entry }), {});
			this.props.onSubmit(values);
		}
	};

	handleCancelClick = () => {
		const { onCancel } = this.props;
		onCancel && onCancel();
	};

	constructor(props) {
		super(props);

		const { departments } = props;
		if (departments && departments.length > 0) {
			this.state.department = { value: '' };
		}
	}

	componentDidMount() {
		this.validateAll();
	}

	render({ title, color, message, loading, departments, t, ...props }, { department }) {
		const defaultTitle = t('change_department_1');
		const defaultMessage = t('choose_a_department_1');

		const valid = this.isValid();

		return (
			<Screen
				color={color}
				title={title || defaultTitle}
				className={createClassName(styles, 'switch-department')}
				{...props}
			>
				<Screen.Content>
					<p className={createClassName(styles, 'switch-department__message')}>{message || defaultMessage}</p>

					<Form onSubmit={this.handleSubmit}>
						<FormField
							label={t('departments')}
							error={department && department.showError && department.error}
						>
							<SelectInput
								name='department'
								value={department && department.value}
								options={departments.map(({ _id, name }) => ({ value: _id, label: name }))}
								placeholder={t('choose_a_department')}
								disabled={loading}
								error={department && department.showError}
								onInput={this.handleDepartmentChange}
							/>
						</FormField>

						<ButtonGroup>
							<Button submit loading={loading} disabled={!valid || loading} stack>{t('start_chat')}</Button>
							<Button disabled={loading} stack secondary onClick={this.handleCancelClick}>{t('cancel')}</Button>
						</ButtonGroup>
					</Form>
				</Screen.Content>
				<Screen.Footer />
			</Screen>
		);
	}
}

export default withTranslation()(SwitchDepartment);
