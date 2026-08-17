import { Box, Button } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type PopoutDockPromptProps = {
	onClosePopout: () => void;
};

const PopoutDockPrompt = ({ onClosePopout }: PopoutDockPromptProps) => {
	const { t } = useTranslation();

	return (
		<Box
			is='section'
			marginBlock={20}
			padding={24}
			width='full'
			display='flex'
			flexDirection='column'
			justifyContent='center'
			alignItems='center'
			flexGrow={1}
		>
			<Box is='h1' color='font-default' marginBlockEnd={40}>
				{t('Call_open_separate_window')}
			</Box>
			<Button onClick={onClosePopout} icon='arrow-from-cross-box' large>
				{t('Show_call_here')}
			</Button>
		</Box>
	);
};

export default PopoutDockPrompt;
