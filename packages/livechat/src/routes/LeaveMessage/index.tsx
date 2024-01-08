import { useContext, useRef } from 'preact/hooks';
import type { JSXInternal } from 'preact/src/jsx';
import type { FieldValues, SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Livechat } from '../../api';
import { Button } from '../../components/Button';
import { Form, FormField, SelectInput, TextInput } from '../../components/Form';
import { FormScrollShadow } from '../../components/Form/FormScrollShadow';
import { MultilineTextInput } from '../../components/Form/MultilineTextInput';
import MarkdownBlock from '../../components/MarkdownBlock';
import { ModalManager } from '../../components/Modal';
import Screen from '../../components/Screen';
import { createClassName } from '../../helpers/createClassName';
import { parseOfflineMessage } from '../../helpers/parseOfflineMessage';
import { sortArrayByColumn } from '../../helpers/sortArrayByColumn';
import { validateEmail } from '../../lib/email';
import { parentCall } from '../../lib/parentCall';
import { createToken } from '../../lib/random';
import { StoreContext } from '../../store';
import styles from './styles.scss';

const LeaveMessage = ({ screenProps }: { screenProps: { [key: string]: unknown }; path: string }) => {
	const {
		config: {
			departments = [],
			messages: { offlineMessage, offlineSuccessMessage, offlineUnavailableMessage },
			theme: { offlineTitle: title, offlineColor: color },
			settings: { displayOfflineForm },
		},
		iframe,
		loading,
		dispatch,
		alerts,
	} = useContext(StoreContext);
	const { t } = useTranslation();

	const topRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

	const {
		handleSubmit,
		formState: { errors, isDirty, isValid, isSubmitting },
		control,
	} = useForm({ mode: 'onChange' });

	const customOfflineTitle = iframe?.theme?.offlineTitle;

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
		} catch (error: unknown) {
			const errorMessage = (error as { error: string })?.error;
			console.error(errorMessage);
			const alert = { id: createToken(), children: errorMessage, error: true, timeout: 5000 };
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
		<Screen
			{...screenProps}
			theme={{ color, title }}
			color={color}
			title={customOfflineTitle || title || defaultTitle}
			className={createClassName(styles, 'leave-message')}
		>
			<FormScrollShadow topRef={topRef} bottomRef={bottomRef}>
				<Screen.Content full>
					<div id='top' ref={topRef} style={{ height: '1px', width: '100%' }} />

					<div className={createClassName(styles, 'leave-message__main-message')}>
						<MarkdownBlock
							text={displayOfflineForm ? offlineMessage || defaultMessage : offlineUnavailableMessage || defaultUnavailableMessage}
						/>
					</div>

					<Form
						// The price of using react-hook-form on a preact project ¯\_(ツ)_/¯
						onSubmit={handleSubmit(onSubmit as SubmitHandler<FieldValues>) as unknown as JSXInternal.GenericEventHandler<HTMLFormElement>}
						id='leaveMessage'
					>
						<FormField required label={t('name')} error={errors.name?.message?.toString()}>
							<Controller
								name='name'
								control={control}
								// defaultValue={guestName}
								rules={{ required: true }}
								render={({ field }) => (
									<TextInput placeholder={t('insert_your_field_here', { field: t('name') })} disabled={loading} {...field} />
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
									<TextInput placeholder={t('insert_your_field_here', { field: t('email') })} disabled={loading} {...field} />
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
											options={sortArrayByColumn(departments, 'name').map(({ _id, name }: { _id: string; name: string }) => ({
												value: _id,
												label: name,
											}))}
											placeholder={t('choose_an_option')}
											disabled={loading}
											{...field}
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
								render={({ field }) => <MultilineTextInput rows={4} placeholder={t('write_your_message')} disabled={loading} {...field} />}
							/>
						</FormField>
					</Form>
					<div ref={bottomRef} id='bottom' style={{ height: '1px', width: '100%' }} />
				</Screen.Content>
			</FormScrollShadow>
			<Screen.Footer>
				<Button loading={loading} form='leaveMessage' submit full disabled={!isDirty || !isValid || loading || isSubmitting}>
					{t('send')}
				</Button>
			</Screen.Footer>
		</Screen>
	);
};

export default LeaveMessage;
