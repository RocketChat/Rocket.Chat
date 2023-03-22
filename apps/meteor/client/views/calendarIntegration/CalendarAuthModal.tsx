import { FieldGroup, Field, EmailInput, Label, PasswordInput, CheckBox, Callout } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';

import GenericModal from '../../components/GenericModal';

export type CalendarAuthPayload = {
	email: string;
	password: string;
	rememberCredentials?: boolean;
};

type CalendarAuthModalProps = {
	onCancel: () => void;
	onConfirm: (data?: any) => void;
};

const CalendarAuthModal = ({ onCancel, onConfirm }: CalendarAuthModalProps) => {
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
					<Label>Email</Label>
					<Field.Row>
						<EmailInput {...register('email', { required: true })} />
					</Field.Row>
					{errors.email && <Field.Error>Required</Field.Error>}
				</Field>
				<Field>
					<Label>Password</Label>
					<Field.Row>
						<PasswordInput {...register('password', { required: true })} />
					</Field.Row>
					{errors.password && <Field.Error>Required</Field.Error>}
				</Field>
				{rememberCredentials && <Callout type='warning'>OH MY GOD</Callout>}
				<Field>
					<Field.Row>
						<Controller
							control={control}
							name='rememberCredentials'
							render={({ field: { onChange, value, ref } }): ReactElement => (
								<CheckBox ref={ref} onChange={onChange} checked={value} id='check-box' />
							)}
						/>
						<Field.Label htmlFor='check-box'>Remember my credentials</Field.Label>
					</Field.Row>
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default CalendarAuthModal;
