import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';

const customStyle = css`
	&.rc-message-box {
		position: relative;
		width: 100%;
		padding: 0 24px;

		&.embedded {
			min-height: 36px;
			padding: 0;

			& .users-typing {
				display: none;
			}

			& .formatting-tips {
				display: none;
			}
		}
	}
`;

export type RoomComposerProps = Omit<AllHTMLAttributes<HTMLElement>, 'is'>;

const RoomComposer = ({ children, ...props }: RoomComposerProps) => {
	const { isEmbedded } = useLayout();

	return (
		<Box is='footer' className={[customStyle, 'rc-message-box', isEmbedded && 'embedded'].filter(Boolean)} {...props}>
			{children}
		</Box>
	);
};

export default RoomComposer;
