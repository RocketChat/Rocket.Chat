import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import type { ReactElement, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

const CodeMirrorBox = ({ label, children }: { label: ReactNode; children: ReactElement }) => {
	const { t } = useTranslation();
	const [fullScreen, toggleFullScreen] = useToggle(false);

	if (fullScreen) {
		return createPortal(
			<Box
				className='code-mirror-box code-mirror-box-fullscreen'
				color='default'
				backgroundColor='light'
				position='absolute'
				zIndex={100}
				display='flex'
				flexDirection='column'
				width='100%'
				height='100%'
				p={40}
			>
				<Box fontScale='p1' mbe={4}>
					{label}
				</Box>
				<Box display='flex' flexDirection='column' height='100%' role='code' aria-label={typeof label === 'string' ? label : undefined}>
					{children}
				</Box>
				<Box mbs={8}>
					<ButtonGroup>
						<Button primary onClick={(): void => toggleFullScreen()}>
							{t('Exit_Full_Screen')}
						</Button>
					</ButtonGroup>
				</Box>
			</Box>,
			document.getElementById('main-content') as HTMLElement,
		);
	}

	return (
		<Box className='code-mirror-box'>
			<Box display='flex' flexDirection='column' height='100%' role='code' aria-label={typeof label === 'string' ? label : undefined}>
				{children}
			</Box>
			<Box mbs={8}>
				<ButtonGroup>
					<Button primary onClick={(): void => toggleFullScreen()}>
						{t('Full_Screen')}
					</Button>
				</ButtonGroup>
			</Box>
		</Box>
	);
};

export default CodeMirrorBox;
