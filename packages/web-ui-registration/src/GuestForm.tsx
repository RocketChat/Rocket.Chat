import { Form } from '@rocket.chat/layout';
import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useRoute, useCurrentRoute } from '@rocket.chat/ui-contexts';

type WindowMaybeDesktop = typeof window & {
	RocketChatDesktop?: {
		openInternalVideoChatWindow?: (url: string, options: undefined) => void;
	};
};

const GuestForm = () => {
	const homeRoute = useRoute('home');
	const [, , queryParams] = useCurrentRoute();

	const handleOpenConference = () => {
		const windowMaybeDesktop = window as WindowMaybeDesktop;
		if (windowMaybeDesktop.RocketChatDesktop?.openInternalVideoChatWindow && queryParams?.callUrl) {
			windowMaybeDesktop.RocketChatDesktop.openInternalVideoChatWindow(queryParams?.callUrl, undefined);
		} else {
			window.open(queryParams?.callUrl, '_blank', 'rel=noreferrer noopener');
		}
	};

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
					<Button onClick={handleOpenConference}>Continue as guest</Button>
				</ButtonGroup>
			</Form.Container>
		</Form>
	);
};

export default GuestForm;
