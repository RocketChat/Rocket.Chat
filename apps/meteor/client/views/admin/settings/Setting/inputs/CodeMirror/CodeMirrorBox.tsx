import { Box, Button, ButtonGroup, FieldError } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

// A constant 2px border is always reserved so toggling the error state only changes the color, avoiding a layout reflow.
const editorBorderProps = { borderWidth: 2, borderStyle: 'solid', borderRadius: 4 } as const;

const CodeMirrorBox = ({ label, children, error }: { label: ReactNode; children: ReactNode; error?: string }) => {
	const { t } = useTranslation();
	const [fullScreen, toggleFullScreen] = useToggle(false);
	const errorId = useId();

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
				<Box
					display='flex'
					flexDirection='column'
					height='100%'
					role='code'
					aria-label={typeof label === 'string' ? label : undefined}
					aria-describedby={error ? errorId : undefined}
					{...editorBorderProps}
					borderColor={error ? 'error' : 'transparent'}
				>
					{children}
				</Box>
				{error && (
					<FieldError id={errorId} role='alert' mbs={4}>
						{error}
					</FieldError>
				)}
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
			<Box
				display='flex'
				flexDirection='column'
				height='100%'
				role='code'
				aria-label={typeof label === 'string' ? label : undefined}
				aria-describedby={error ? errorId : undefined}
				{...editorBorderProps}
				borderColor={error ? 'error' : 'transparent'}
			>
				{children}
			</Box>
			{error && (
				<FieldError id={errorId} role='alert' mbs={4}>
					{error}
				</FieldError>
			)}
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
