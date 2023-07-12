import { useContext } from 'preact/hooks';
import type { FieldValues, SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Livechat } from '../../api';
import { Button } from '../../components/Button';
import { Form, FormField, SelectInput, TextInput } from '../../components/Form';
import type { CustomField } from '../../components/Form/CustomFields';
import { MultilineTextInput } from '../../components/Form/MultilineTextInput';
import { renderMarkdown } from '../../components/Messages/MessageText/markdown';
import { ModalManager } from '../../components/Modal';
import Screen from '../../components/Screen';
import { parseOfflineMessage, createClassName, sortArrayByColumn } from '../../components/helpers';
import type { department } from '../../definitions/departments';
import { validateEmail } from '../../lib/email';
import { parentCall } from '../../lib/parentCall';
import { createToken } from '../../lib/random';
import { StoreContext } from '../../store';
import styles from './styles.scss';

type ContextReturn = {
	config: {
		departments?: department[];
		messages: {
			offlineMessage?: string;
			offlineUnavailableMessage?: string;
			offlineSuccessMessage?: string;
		};
		settings: {
			displayOfflineForm?: boolean;
		};
		theme: {
			offlineTitle?: string;
			offlineColor?: string;
		};
		customFields?: CustomField[];
	};
	iframe?: {
		theme: {
			offlineTitle?: string;
		};
	};
	loading: boolean;
	dispatch: (args: unknown) => void;
	user?: { _id: string; [key: string]: unknown };
	alerts: unknown[];
};

const LeaveMessage = ({ screenProps }: { screenProps: { [key: string]: unknown } }) => {
	const {
		config: {
			departments = [],
			messages: { offlineMessage, offlineSuccessMessage, offlineUnavailableMessage },
			theme: { offlineTitle: title, offlineColor: color },
			settings: { displayOfflineForm },
		},
		loading,
		dispatch,
		alerts,
	}: ContextReturn = useContext(StoreContext);
	const { t } = useTranslation();

	const {
		handleSubmit,
		formState: { errors, isDirty, isValid, isSubmitting },
		control,
	} = useForm({ mode: 'onChange' });

	type FormValues = { name: string; email: string; department?: string; message: string };

	const onSubmit = async ({ name, email, department, message }: FormValues) => {
		const fields = {
			name,
			email,
			...(department && { department }),
			message,
		};
		await dispatch({ loading: true });
		try {
			// TODO: Remove intersection after ts refactor of parseOfflineMessage
			const payload = parseOfflineMessage(fields) as FormValues & { host: string };
			const text = await Livechat.sendOfflineMessage(payload);
			await ModalManager.alert({
				text: offlineSuccessMessage || text,
			});
			parentCall('callback', ['offline-form-submit', fields]);
			return true;
		} catch (error) {
			const {
				data: { message },
			} = error as { data: { message: string } };
			console.error(message);
			const alert = { id: createToken(), children: message, error: true, timeout: 5000 };
			await dispatch({ alerts: (alerts.push(alert), alerts) });
			return false;
		} finally {
			await dispatch({ loading: false });
		}
	};

	const defaultTitle = t('leave_a_message');
	const defaultMessage = t('we_are_not_online_right_now_please_leave_a_message');
	const defaultUnavailableMessage = ''; // TODO

	return (
		<Screen color={color} title={title || defaultTitle} className={createClassName(styles, 'leave-message')} {...screenProps}>
			<Screen.Content>
				<div
					className={createClassName(styles, 'leave-message__main-message')}
					// TODO: Implement Gazzodown and remove dangerouslySetInnerHTML from Livechat
					// eslint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={{
						__html: renderMarkdown(
							displayOfflineForm ? offlineMessage || defaultMessage : offlineUnavailableMessage || defaultUnavailableMessage,
						),
					}}
				/>

				<Form onSubmit={handleSubmit(onSubmit as SubmitHandler<FieldValues>)} id='leaveMessage'>
					<FormField required label={t('name')} error={errors.name?.message?.toString()}>
						<Controller
							name='name'
							control={control}
							// defaultValue={guestName}
							rules={{ required: true }}
							render={({ field }) => (
								<TextInput name='name' placeholder={t('insert_your_field_here', { field: t('name') })} disabled={loading} field={field} />
							)}
						/>
					</FormField>

					<FormField required label={t('email')} error={errors.email?.message?.toString()}>
						<Controller
							name='email'
							control={control}
							// defaultValue={guestEmail}
							rules={{
								required: true,
								validate: { checkEmail: (value) => validateEmail(value, { style: 'rfc' }) || t('invalid_email') },
							}}
							render={({ field }) => (
								<TextInput name='email' placeholder={t('insert_your_field_here', { field: t('email') })} disabled={loading} field={field} />
							)}
						/>
					</FormField>

					{departments?.some((dept) => dept.showOnOfflineForm) ? (
						<FormField label={t('i_need_help_with')} error={errors.department?.message?.toString()}>
							<Controller
								name='department'
								control={control}
								render={({ field }) => (
									<SelectInput
										name='department'
										options={sortArrayByColumn(departments, 'name').map(({ _id, name }: { _id: string; name: string }) => ({
											value: _id,
											label: name,
										}))}
										placeholder={t('choose_an_option')}
										disabled={loading}
										field={field}
									/>
								)}
							/>
						</FormField>
					) : null}
					<FormField required label={t('message')} error={errors.message?.message?.toString()}>
						<Controller
							name='message'
							control={control}
							rules={{ required: true }}
							render={({ field }) => (
								<MultilineTextInput name='message' rows={4} placeholder={t('write_your_message')} disabled={loading} field={field} />
							)}
						/>
					</FormField>
				</Form>
			</Screen.Content>
			<Screen.Footer>
				<Button loading={loading} form='leaveMessage' submit full disabled={!isDirty || !isValid || loading || isSubmitting}>
					{t('send')}
				</Button>
			</Screen.Footer>
		</Screen>
	);
};

export default LeaveMessage;
