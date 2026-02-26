import { Box, Palette } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { forwardRef } from 'react';

type MessageComposerProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	children: ReactNode;
	is?: ElementType<any>;
	variant?: 'default' | 'error' | 'editing';
	isBlur?: boolean;
};

const subtleFocus = css`
	&&.is-blur:focus-within {
		box-shadow: 0 0 0 0px ${Palette.stroke['stroke-light']};
	}
`;

const MessageComposer = forwardRef<HTMLElement, MessageComposerProps>(
	function MessageComposer(
		{ variant, className, isBlur = false, children, ...props },
		ref,
	): ReactElement {
		return (
			<Box
				rcx-input-box__wrapper
				{...props}
				className={[subtleFocus, className, isBlur && 'is-blur']}
				mbs={2}
				bg={variant === 'editing' ? 'status-background-warning-2' : undefined}
				ref={ref}
				role='group'
				display='flex'
				flexDirection='column'
				overflow='hidden'
				p={0}
			>
				{children}
			</Box>
		);
	},
);

export default MessageComposer;
// import { Box, Palette } from '@rocket.chat/fuselage';
// import { css } from '@rocket.chat/css-in-js';
// import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from 'react';
// import { forwardRef } from 'react';

// type MessageComposerProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
// 	children: ReactNode;
// 	is?: ElementType<any>;
// 	variant?: 'default' | 'error' | 'editing';
// 	isBlur?: boolean;
// };

// const MessageComposer = forwardRef<HTMLElement, MessageComposerProps>(function MessageComposer(
// 	{ variant, className, isBlur, ...props },
// 	ref,
// ): ReactElement {
// 	const subtleFocus = css`
// 		&&.is-blur:focus-within {
// 			box-shadow: 0 0 0 0px ${Palette.stroke['stroke-light']};
// 		}
// 	`;
// 	const blurClass = isBlur ? 'is-blur' : 'no-blur';
//   console.log('MessageComposer render', { variant, className, subtleFocus, blurClass });
// 	return (
// 		<Box
// 			rcx-input-box__wrapper
// 			className={[subtleFocus, blurClass]}
// 			mbs={2}
// 			bg={variant === 'editing' ? 'status-background-warning-2' : undefined}
// 			ref={ref}
// 			role='group'
// 			display='flex'
// 			flexDirection='column'
// 			overflow='hidden'
// 			p={0}
// 			{...props}
// 		/>
// 	);
// });
// // const MessageComposer = forwardRef<HTMLElement, MessageComposerProps>(function MessageComposer(
// // 	{ variant, className, isBlur, ...props },
// // 	ref,
// // ): ReactElement {
// // 	const subtleFocus = css`
// // 		&.is-blur:focus-within {
// // 			box-shadow: 0 0 0 0px ${Palette.stroke['stroke-light']};
// // 		}
// // 	`;
// // 	console.log('MessageComposer render', { variant, className, subtleFocus });

// // 	// const blurClass = isBlur ? 'is-blur' : 'no-blur';
// // 	// const combinedClassName = `${blurClass ? `${blurClass}` : ''}`;

// // 	// Add this temporarily to debug:
// // 	// console.log('Box className being set to:', {combinedClassName, blurClass});
// // 	return (
// // 		<Box
// // 			{...props}
// // 			rcx-input-box__wrapper
// // 			className={["subtleFocus","is-blur"]}
// // 			mbs={2}
// // 			bg={variant === 'editing' ? 'status-background-warning-2' : undefined}
// // 			ref={ref}
// // 			role='group'
// // 			display='flex'
// // 			flexDirection='column'
// // 			overflow='hidden'
// // 			p={0}
// // 		/>
// // 	);
// // });
// export default MessageComposer;
// // const MessageComposer = forwardRef<HTMLElement, MessageComposerProps>(function MessageComposer({ variant, ...props }, ref): ReactElement {
// // 	const subtleFocus = css`
// // 	&&.is-blur:focus-within {
// // 		box-shadow: 0 0 0 0px ${Palette.stroke['stroke-light']};
// // 	}
// // 	`;
// // 	return (
// // 		<Box
// // 			rcx-input-box__wrapper
// // 			className={[subtleFocus,"is-blur"]}
// // 			mbs={2}
// // 			bg={variant === 'editing' ? 'status-background-warning-2' : undefined}
// // 			ref={ref}
// // 			role='group'
// // 			display='flex'
// // 			flexDirection='column'
// // 			overflow='hidden'
// // 			p={0}
// // 			{...props}
// // 		/>
// // 	);
// // });
