import { FieldGroup, Field, EmailInput, Label, PasswordInput, CheckBox } from '@rocket.chat/fuselage';
import React from 'react';

import GenericModal from '../../components/GenericModal';

type CalendarAuthModalProps = {
	onCancel: () => void;
};

const CalendarAuthModal = ({ onCancel }: CalendarAuthModalProps) => {
	// console.log('calendar integration');
	return (
		<GenericModal
			variant='warning'
			icon={null}
			tagline='Outlook Calendar app'
			title='Outlook login'
			onCancel={onCancel}
			onConfirm={() => console.log('submit')}
			confirmText='Log in'
		>
			<FieldGroup>
				<Field>
					<Label>Email</Label>
					<Field.Row>
						<EmailInput />
					</Field.Row>
				</Field>
				<Field>
					<Label>Password</Label>
					<Field.Row>
						<PasswordInput />
					</Field.Row>
				</Field>
				<Field>
					<Field.Row>
						<CheckBox id='check-box' />
						<Field.Label htmlFor='check-box'>Remember my credentials</Field.Label>
					</Field.Row>
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default CalendarAuthModal;
