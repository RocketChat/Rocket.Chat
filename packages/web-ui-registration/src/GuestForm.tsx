import { Form } from '@rocket.chat/layout';
import { Button, ButtonGroup } from '@rocket.chat/fuselage';

import type { DispatchLoginRouter } from './hooks/useLoginRouter';

const GuestForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }) => {
	return (
		<Form>
			<Form.Header>
				<Form.Title>Choose how you want to join</Form.Title>
			</Form.Header>
			<Form.Container>
				<ButtonGroup large stretch vertical>
					<Button primary onClick={() => setLoginRoute('login')}>
						Login with Rocket.chat
					</Button>
					<Button onClick={() => setLoginRoute('anonymous')}>Continue as guest</Button>
				</ButtonGroup>
			</Form.Container>
		</Form>
	);
};

export default GuestForm;
