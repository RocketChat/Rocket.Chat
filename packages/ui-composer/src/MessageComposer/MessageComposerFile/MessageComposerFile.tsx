import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import type { AllHTMLAttributes, ReactElement } from 'react';

type MessageComposerFileProps = {
	fileTitle: string;
	fileSubtitle: string;
	actionIcon: ReactElement;
	error?: boolean;
	onClick: () => void;
} & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const MessageComposerFile = ({ fileTitle, fileSubtitle, actionIcon, error, onClick, ...props }: MessageComposerFileProps) => {
	const closeWrapperStyle = css`
		position: absolute;
		right: 0.5rem;
		top: 0.5rem;
	`;

	const previewWrapperStyle = css`
		background-color: ${Palette.surface['surface-tint']};

		&:hover {
			cursor: ${error ? 'unset' : 'pointer'};
			background-color: ${Palette.surface['surface-hover']};
		}
	`;

	const buttonProps = useButtonPattern(onClick);

	return (
		<Box
			rcx-input-box__wrapper
			readOnly={error}
			className={previewWrapperStyle}
			display='flex'
			flexShrink={0}
			flexGrow={0}
			padding={4}
			borderRadius={4}
			borderWidth={1}
			borderColor={error ? 'error' : 'extra-light'}
			alignItems='center'
			position='relative'
			height='x56'
			width='x200'
			mie={8}
			{...buttonProps}
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

export default MessageComposerFile;
