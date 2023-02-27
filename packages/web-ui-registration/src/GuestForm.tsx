import { Form } from '@rocket.chat/layout';
import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useRoute, useCurrentRoute } from '@rocket.chat/ui-contexts';

const GuestForm = () => {
	const homeRoute = useRoute('home');
	const [, , queryParams] = useCurrentRoute();

	return (
		<Form>
			<Form.Header>
				<Form.Title>Choose how you want to join</Form.Title>
			</Form.Header>
			<Form.Container>
				<ButtonGroup large stretch vertical>
					<Button primary onClick={() => homeRoute.push({ context: 'redirectConference' }, queryParams)}>
						Login with Rocket.chat
					</Button>
					<Button onClick={() => window.open(queryParams?.callUrl, '_blank', 'rel=noreferrer noopener')}>Continue as guest</Button>
				</ButtonGroup>
			</Form.Container>
		</Form>
	);
};

export default GuestForm;
