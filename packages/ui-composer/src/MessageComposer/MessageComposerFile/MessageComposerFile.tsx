import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { useMemo, type KeyboardEvent, type MouseEvent, type AllHTMLAttributes, type ReactElement } from 'react';

type MessageComposerFileProps = {
	fileTitle: string;
	fileSubtitle: string;
	actionIcon: ReactElement;
	error?: boolean;
	disabled?: boolean;
	onClick: () => void;
} & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const MessageComposerFile = ({
	fileTitle,
	fileSubtitle,
	actionIcon,
	error,
	disabled,
	onClick,
	className,
	...props
}: MessageComposerFileProps) => {
	const closeWrapperStyle = css`
		position: absolute;
		right: 0.5rem;
		top: 0.5rem;
	`;

	const previewWrapperStyle = css`
		background-color: ${Palette.surface['surface-tint']};
		cursor: ${error || disabled ? 'not-allowed' : 'pointer'};

		&:hover {
			background-color: ${!error && !disabled ? Palette.surface['surface-hover'] : Palette.surface['surface-tint']};
		}
	`;

	const handleClick = (e: MouseEvent<Element> | KeyboardEvent<Element>) => {
		e.stopPropagation();
		if (!error && !disabled) {
			onClick();
		}
	};

	const buttonProps = useButtonPattern(handleClick);

	const subtitleColor = useMemo(() => {
		if (error) {
			return 'danger';
		}

		if (disabled) {
			return 'disabled';
		}

		return 'hint';
	}, [disabled, error]);

	return (
		<Box
			rcx-input-box__wrapper={!error && !disabled}
			readOnly={error}
			className={[previewWrapperStyle, className].filter(Boolean)}
			role='group'
			aria-label={fileTitle}
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
			onClick={handleClick}
			{...props}
		>
			<Box width='x160' mis={4} display='flex' flexDirection='column'>
				<Box {...buttonProps} fontScale='p2' color={disabled ? 'disabled' : 'info'} withTruncatedText>
					{fileTitle}
				</Box>
				<Box fontScale='c1' color={subtitleColor} textTransform={!error ? 'uppercase' : 'none'} withTruncatedText>
					{fileSubtitle}
				</Box>
			</Box>
			{!disabled && <Box className={closeWrapperStyle}>{actionIcon}</Box>}
		</Box>
	);
};

export default MessageComposerFile;
