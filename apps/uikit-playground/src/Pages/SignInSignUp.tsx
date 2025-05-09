import { css } from '@rocket.chat/css-in-js';
import { Flex, Box, InputBox, Button, Label } from '@rocket.chat/fuselage';
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

const SignInSignUp = ({ route }: { route: string }) => {
  const navigate = useNavigate();
  const clickHandler = () => {
    navigate(route === routes.login ? routes.signup : routes.login);
  };
  return (
    <Flex.Container justifyContent="center" alignItems="center">
      <Box w="100%" flexGrow={1}>
        <Flex.Container
          justifyContent="start"
          alignItems="center"
          direction="column"
        >
          <Box w="max-content" h="100%">
            <Box w="180px" h="40px" mbs="100px">
              <RocketChatLogo />
            </Box>
            <Label mbs="20px" fontScale="hero">
              {labels[route].header}
            </Label>
            <Label mbs="10px" fontScale="p2">
              {labels[route].description}
            </Label>
            <InputBox mbs="20px" w="80%" maxHeight="50px" type="email" />
            <Button mbs="20px" w="80%" primary>
              {labels[route].button}
            </Button>
            <Label mbs="20px" fontScale="p2">
              {`${labels[route].footer} `}
              <Label
                fontScale="p2"
                color="primary"
                onClick={clickHandler}
                className={css`
                  cursor: pointer;
                `}
              >
                {labels[route].footerButton}
              </Label>
            </Label>
          </Box>
        </Flex.Container>
      </Box>
    </Flex.Container>
  );
};

export default SignInSignUp;
