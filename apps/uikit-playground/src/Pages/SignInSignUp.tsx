import { css } from '@rocket.chat/css-in-js';
import { Box, InputBox, Button } from '@rocket.chat/fuselage';
import { RocketChatLogo } from '@rocket.chat/logo';
import { useNavigate } from 'react-router-dom';

import routes from '../Routes/Routes';

const labels = {
	[routes.login]: {
		header: 'Sign in to your workspace',
		description: 'Sign in to your workspace',
		button: 'Continue',
		footer: 'dont have a workspace?',
		footerButton: 'Create one',
	},
	[routes.signup]: {
		header: 'First, enter your email',
		description: 'We suggest using the email address you use at work.',
		button: 'Create a workspace',
		footer: 'Already have a workspace?',
		footerButton: 'Sign in',
	},
};

export type SignInSignUpProps = { route: string };

const SignInSignUp = ({ route }: SignInSignUpProps) => {
	const navigate = useNavigate();
	const clickHandler = () => {
		navigate(route === routes.login ? routes.signup : routes.login);
	};
	return (
		<Box width='100%' flexGrow={1} display='flex' justifyContent='center' alignItems='center'>
			<Box width='max-content' height='100%' display='flex' flexDirection='column' justifyContent='flex-start' alignItems='center'>
				<Box width='180px' height='40px' marginBlockStart='100px'>
					<RocketChatLogo />
				</Box>
				<Box marginBlockStart='20px' fontScale='hero'>
					{labels[route].header}
				</Box>
				<Box marginBlockStart='x8' fontScale='p2'>
					{labels[route].description}
				</Box>
				<Box display='flex' flexDirection='column' gap='20px' paddingBlockStart='20px' width='80%'>
					<InputBox type='email' />
					<Button variant='primary'>{labels[route].button}</Button>
				</Box>
				<Box marginBlockStart='20px' fontScale='p2'>
					{`${labels[route].footer} `}
					<Box
						is='span'
						fontScale='p2'
						color='primary'
						onClick={clickHandler}
						className={css`
							cursor: pointer;
						`}
					>
						{labels[route].footerButton}
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default SignInSignUp;
