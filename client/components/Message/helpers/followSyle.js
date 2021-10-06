import { css } from '@rocket.chat/css-in-js';

export const anchor = 'rcx-contextual-message__follow';

export const followStyle = css`
	& .${anchor} {
		opacity: 0;
	}
	.${anchor}:focus, &:hover .${anchor}, &:focus .${anchor} {
		opacity: 1;
	}
`;
