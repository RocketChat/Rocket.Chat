import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const MessageComposerFileLoader = ({ className, ...props }: Omit<AllHTMLAttributes<HTMLOrSVGElement>, 'is'>) => {
	const customCSS = css`
		animation: spin-animation 0.8s linear infinite;

		@keyframes spin-animation {
			from {
				transform: rotate(0deg);
			}

			to {
				transform: rotate(360deg);
			}
		}
	`;

	return (
		<Box
			className={[customCSS, className].filter(Boolean)}
			is='svg'
			size='x24'
			viewBox='0 0 24 24'
			fill='none'
			xmlns='http://www.w3.org/2000/svg'
			{...props}
		>
			<circle cx='11.9998' cy='12' r='8' stroke={Palette.stroke['stroke-extra-light'].toString()} strokeWidth='2' />
			<path
				d='M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12'
				stroke={Palette.stroke['stroke-highlight'].toString()}
				strokeWidth='2'
				strokeLinecap='round'
			/>
		</Box>
	);
};

export default MessageComposerFileLoader;
