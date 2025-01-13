import type { IOmnichannelRoom, Serialized } from '@rocket.chat/core-typings';
import { useContext } from 'preact/hooks';
import { route } from 'preact-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import styles from './styles.scss';
import { Livechat } from '../../api';
import { Button } from '../../components/Button';
import { ButtonGroup } from '../../components/ButtonGroup';
import { Form, FormField, SelectInput } from '../../components/Form';
import { ModalManager } from '../../components/Modal';
import Screen from '../../components/Screen';
import { createClassName } from '../../helpers/createClassName';
import { loadConfig } from '../../lib/main';
import { createToken } from '../../lib/random';
import type { StoreState } from '../../store';
import { StoreContext } from '../../store';

type SwitchDepartmentFormData = { department: string };

type SwitchDepartmentProps = {
	path: string;
};

const SwitchDepartment = (_: SwitchDepartmentProps) => {
	const { t } = useTranslation();

	const {
		config: {
			messages: { switchDepartmentMessage },
			departments: deps = [],
		},
		iframe: { guest },
		iframe,
		room,
		loading = true,
		dispatch,
		alerts,
		token,
	} = useContext(StoreContext);

	const {
		handleSubmit,
		formState: { errors, isDirty, isValid, isSubmitting },
		control,
	} = useForm<SwitchDepartmentFormData>({ mode: 'onChange' });

	const departments = deps.filter((dept) => dept.showOnRegistration && dept._id !== guest?.department);

	const confirmChangeDepartment = async () => {
		const result = await ModalManager.confirm({
			text: t('are_you_sure_you_want_to_switch_the_department'),
		});

		return typeof result.success === 'boolean' && result.success;
	};

	const onSubmit = async ({ department }: SwitchDepartmentFormData) => {
		const confirm = await confirmChangeDepartment();
		if (!confirm) {
			return;
		}

		if (!room) {
			const { visitor: user } = await Livechat.grantVisitor({ visitor: { department, token } });
			await dispatch({
				user: user as StoreState['user'],
				alerts: (alerts.push({ id: createToken(), children: t('department_switched'), success: true }), alerts),
			});
			return route('/');
		}

		await dispatch({ loading: true });
		try {
			const { _id: rid } = room;
			const result = await Livechat.transferChat({ rid, department });
			// TODO: Investigate why the api results are not returning the correct type
			const { success } = result as Serialized<
				| {
						room: IOmnichannelRoom;
						success: boolean;
				  }
				| {
						room: IOmnichannelRoom;
						success: boolean;
						warning: string;
				  }
			>;
			if (!success) {
				throw t('no_available_agents_to_transfer');
			}

			await dispatch({ iframe: { ...iframe, guest: { ...guest, department } }, loading: false } as Pick<StoreState, 'iframe' | 'loading'>);
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
		<Screen title={defaultTitle} className={createClassName(styles, 'switch-department')}>
			<Screen.Content>
				<p className={createClassName(styles, 'switch-department__message')}>{switchDepartmentMessage || defaultMessage}</p>

				<Form
					id='switchDepartment'
					// The price of using react-hook-form on a preact project ¯\_(ツ)_/¯
					onSubmit={handleSubmit(onSubmit)}
				>
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
				<ButtonGroup full>
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
