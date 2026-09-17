import { Button, ButtonGroup, Box } from '@rocket.chat/fuselage';
import { useSessionDispatch, useTranslation } from '@rocket.chat/ui-contexts';

const ComposerAnonymous = () => {
	const t = useTranslation();
	const setForceLogin = useSessionDispatch('forceLogin');

	return (
		<Box marginBlock={16}>
			<ButtonGroup>
				<Button small primary onClick={() => setForceLogin(true)}>
					{t('Sign_in_to_start_talking')}
				</Button>
			</ButtonGroup>
		</Box>
	);
};

export default ComposerAnonymous;
