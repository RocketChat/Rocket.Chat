import { FieldGroup, Field, TextInput, Label, PasswordInput, CheckBox, Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';

import GenericModal from '../../components/GenericModal';

export type CalendarAuthPayload = {
	login: string;
	password: string;
	rememberCredentials?: boolean;
};

type CalendarAuthModalProps = {
	onCancel: () => void;
	onConfirm: (data?: any) => void;
};

const CalendarAuthModal = ({ onCancel, onConfirm }: CalendarAuthModalProps) => {
	const t = useTranslation();
	const {
		register,
		handleSubmit,
		watch,
		control,
		formState: { errors, isSubmitting },
	} = useForm<CalendarAuthPayload>({ mode: 'onChange', defaultValues: { rememberCredentials: false } });

	const { rememberCredentials } = watch();
	const handleAuth = (data: CalendarAuthPayload) => onConfirm(data);

	return (
		<GenericModal
			variant='warning'
			icon={null}
			tagline='Outlook Calendar app'
			title='Outlook login'
			onCancel={onCancel}
			onConfirm={handleSubmit(handleAuth)}
			confirmText='Log in'
			confirmDisabled={isSubmitting}
		>
			<FieldGroup>
				<Field>
					<Label>{t('Login')}</Label>
					<Field.Row>
						<TextInput {...register('login', { required: true })} />
					</Field.Row>
					{errors.login && <Field.Error>{t('Field_required')}</Field.Error>}
				</Field>
				<Field>
					<Label>{t('Password')}</Label>
					<Field.Row>
						<PasswordInput {...register('password', { required: true })} />
					</Field.Row>
					{errors.password && <Field.Error>{t('Field_required')}</Field.Error>}
				</Field>
				{/* // TODO: check if it will be needed */}
				{rememberCredentials && (
					<Callout title='Security warning' type='warning'>
						Your credentials will be saved on plain text. Do not share your browser session.
					</Callout>
				)}
				<Field>
					<Field.Row>
						<Controller
							control={control}
							name='rememberCredentials'
							render={({ field: { onChange, value, ref } }): ReactElement => (
								<CheckBox ref={ref} onChange={onChange} checked={value} id='check-box' />
							)}
						/>
						<Field.Label htmlFor='check-box'>{t('Remember_my_credentials')}</Field.Label>
					</Field.Row>
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default CalendarAuthModal;
