import { css } from '@rocket.chat/css-in-js';
import { useStyle } from '@rocket.chat/fuselage';

const homeCard = css`
	width: 21.25rem;
`;

/** The home page's cards share one width, the basis their group stretches them from. */
export const useHomeCardClassName = (className?: string) => [useStyle(homeCard), className].filter(Boolean).join(' ');
