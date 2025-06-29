import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes, ReactElement } from 'react';

type MessageComposerFileComponentProps = {
	fileTitle: string;
	fileSubtitle: string;
	actionIcon: ReactElement;
	error?: boolean;
} & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

// TODO: This component will live in `ui-composer`
const MessageComposerFileComponent = ({ fileTitle, fileSubtitle, actionIcon, error, ...props }: MessageComposerFileComponentProps) => {
	const closeWrapperStyle = css`
		position: absolute;
		right: 0.5rem;
		top: 0.5rem;
	`;

	const previewWrapperStyle = css`
		background-color: 'surface-tint';

		&:hover {
			cursor: ${error ? 'unset' : 'pointer'};
			background-color: ${Palette.surface['surface-hover']};
		}
	`;

	return (
		<Box
			tabIndex={0}
			role='button'
			rcx-input-box__wrapper
			readOnly={error}
			className={previewWrapperStyle}
			display='flex'
			padding={4}
			borderRadius={4}
			borderWidth={1}
			borderColor={error ? 'error' : 'extra-light'}
			alignItems='center'
			position='relative'
			height='x56'
			width='x200'
			mie={8}
			{...props}
		>
			<Box width='x160' mis={4} display='flex' flexDirection='column'>
				<Box fontScale='p2' color='info' withTruncatedText>
					{fileTitle}
				</Box>
				<Box fontScale='c1' color={error ? 'danger' : 'hint'} textTransform={!error ? 'uppercase' : 'none'} withTruncatedText>
					{fileSubtitle}
				</Box>
			</Box>
			<Box className={closeWrapperStyle}>{actionIcon}</Box>
		</Box>
	);
};

export default MessageComposerFileComponent;
