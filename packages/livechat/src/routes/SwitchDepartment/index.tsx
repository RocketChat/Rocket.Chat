import { route } from 'preact-router';
import { useContext } from 'preact/hooks';
import type { FieldValues, SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Livechat } from '../../api';
import { Button } from '../../components/Button';
import { ButtonGroup } from '../../components/ButtonGroup';
import { Form, FormField, SelectInput } from '../../components/Form';
import { ModalManager } from '../../components/Modal';
import Screen from '../../components/Screen';
import { createClassName } from '../../components/helpers';
import type { department } from '../../definitions/departments';
import { loadConfig } from '../../lib/main';
import { createToken } from '../../lib/random';
import { StoreContext } from '../../store';
import styles from './styles.scss';

type ContextReturn = {
	config: {
		departments?: department[];
		messages: {
			switchDepartmentMessage?: string;
		};
		settings: {
			nameFieldRegistrationForm?: boolean;
			emailFieldRegistrationForm?: boolean;
		};
		theme: {
			color?: string;
		};
	};
	iframe: {
		guest: {
			department?: string;
			name?: string;
			email?: string;
		};
	};
	loading: boolean;
	token: string;
	room?: { _id: string; [key: string]: unknown };
	dispatch: (args: unknown) => void;
	alerts: unknown[];
	user?: { _id: string; [key: string]: unknown };
};

const SwitchDepartment = ({ screenProps }: { screenProps: { [key: string]: unknown } }) => {
	const { t } = useTranslation();

	const {
		config: {
			messages: { switchDepartmentMessage },
			departments: deps = [],
			theme: { color },
		},
		iframe: { guest },
		iframe,
		room,
		loading = false,
		dispatch,
		alerts,
		token,
	}: ContextReturn = useContext(StoreContext);

	const {
		handleSubmit,
		formState: { errors, isDirty, isValid, isSubmitting },
		control,
	} = useForm({ mode: 'onChange' });

	const departments = deps.filter((dept) => dept.showOnRegistration && dept._id !== guest?.department);

	const confirmChangeDepartment = async () => {
		const result = await ModalManager.confirm({
			text: t('are_you_sure_you_want_to_switch_the_department'),
		});

		return typeof result.success === 'boolean' && result.success;
	};

	const onSubmit = async ({ department }: { department: string }) => {
		const confirm = await confirmChangeDepartment();
		if (!confirm) {
			return;
		}

		if (!room) {
			const { visitor: user } = await Livechat.grantVisitor({ visitor: { department, token } });
			await dispatch({ user, alerts: (alerts.push({ id: createToken(), children: t('department_switched'), success: true }), alerts) });
			return route('/');
		}

		await dispatch({ loading: true });
		try {
			const { _id: rid } = room;
			const result = await Livechat.transferChat({ rid, department });
			console.log(result);
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
			await dispatch({
				alerts: (alerts.push({ id: createToken(), children: t('no_available_agents_to_transfer'), warning: true }), alerts),
			});
		} finally {
			await dispatch({ loading: false });
		}
	};

	const handleCancel = () => {
		route('/');
	};

	const defaultTitle = t('change_department_1');
	const defaultMessage = t('choose_a_department_1');

	return (
		<Screen color={color} title={defaultTitle} className={createClassName(styles, 'switch-department')} {...screenProps}>
			<Screen.Content>
				<p className={createClassName(styles, 'switch-department__message')}>{switchDepartmentMessage || defaultMessage}</p>

				<Form id='switchDepartment' onSubmit={handleSubmit(onSubmit as SubmitHandler<FieldValues>)}>
					<FormField label={t('i_need_help_with')} error={errors.department?.message?.toString()}>
						<Controller
							name='department'
							control={control}
							render={({ field }) => (
								<SelectInput
									options={departments.map(({ _id, name }) => ({ value: _id, label: name }))}
									placeholder={t('choose_a_department')}
									disabled={loading}
									{...field}
								/>
							)}
						/>
					</FormField>
				</Form>
			</Screen.Content>
			<Screen.Footer>
				<ButtonGroup>
					<Button loading={loading} form='switchDepartment' submit stack full disabled={!isDirty || !isValid || loading || isSubmitting}>
						{t('start_chat')}
					</Button>
					<Button loading={loading} stack secondary onClick={handleCancel}>
						{t('cancel')}
					</Button>
				</ButtonGroup>
			</Screen.Footer>
		</Screen>
	);
};

export default SwitchDepartment;
