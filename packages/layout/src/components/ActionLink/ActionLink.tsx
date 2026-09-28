import { Box } from '@rocket.chat/fuselage';
import type { MouseEvent, ComponentProps, ReactNode, AnchorHTMLAttributes } from 'react';
import { useCallback } from 'react';

export type ActionLinkProps = {
	children: ReactNode;
	href?: string;
	fontScale?: ComponentProps<typeof Box>['fontScale'];
} & AnchorHTMLAttributes<HTMLAnchorElement>;

const ActionLink = ({ children, href = '#', fontScale = 'p2', onClick, ...props }: ActionLinkProps) => {
	const handleClick = useCallback(
		(event: MouseEvent<HTMLAnchorElement>) => {
			if (onClick) {
				event.preventDefault();
				onClick(event);
			}
		},
		[onClick],
	);

	return (
		<Box {...props} is='a' fontScale={fontScale} href={href} color='info' onClick={handleClick}>
			{children}
		</Box>
	);
};

export default ActionLink;
