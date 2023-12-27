import { Button, TextInput, PasswordInput, Field, FieldLabel, FieldRow, FieldGroup, ButtonGroup } from '@rocket.chat/fuselage';
import { VerticalWizardLayout, Form } from '@rocket.chat/layout';
import { RocketChatLogo } from '@rocket.chat/logo';
import React from 'react';

export default function Login({ onLogin }: { onLogin: (username: string, password: string) => Promise<void> }) {
	return (
		<VerticalWizardLayout logo={<RocketChatLogo />}>
			<Form
				onSubmit={(e) => {
					e.preventDefault();
					const username = e.currentTarget.username.value;
					const password = e.currentTarget.password.value;

					void onLogin(username, password);
				}}
			>
				<Form.Header>
					<Form.Title id='login'>Login</Form.Title>
				</Form.Header>
				<Form.Container>
					<FieldGroup>
						<Field>
							<FieldLabel>Username</FieldLabel>
							<FieldRow>
								<TextInput name='username' placeholder='Username' />
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel>Password</FieldLabel>
							<FieldRow>
								<PasswordInput name='password' placeholder='Password' />
							</FieldRow>
						</Field>
					</FieldGroup>
				</Form.Container>
				<Form.Footer>
					<ButtonGroup w='full' align='end'>
						<Button type='submit' primary>
							Login
						</Button>
					</ButtonGroup>
				</Form.Footer>
			</Form>
		</VerticalWizardLayout>
	);
}
