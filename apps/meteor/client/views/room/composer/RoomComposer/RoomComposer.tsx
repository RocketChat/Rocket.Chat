import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes } from 'react';

const customStyle = css`
	&.rc-message-box {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		width: 100%;
		max-height: 100%;
		padding: 0 24px;

		& > [role='group'] {
			flex-shrink: 0;
		}

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

const RoomComposer = ({ children, ...props }: Omit<AllHTMLAttributes<HTMLElement>, 'is'>) => {
	const { isEmbedded } = useLayout();

	return (
		<Box is='footer' className={[customStyle, 'rc-message-box', isEmbedded && 'embedded'].filter(Boolean)} {...props}>
			{children}
		</Box>
	);
};

export default RoomComposer;
