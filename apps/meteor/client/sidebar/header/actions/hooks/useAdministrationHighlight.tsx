import { css } from '@rocket.chat/css-in-js';
import { Palette } from '@rocket.chat/fuselage';

import { useOmnichannelHighlight } from '../../../../../ee/client/omnichannel/hooks/useOmnichannelHighlight';

const highlightDot = css`
	position: relative;

	&::after {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		display: block;
		flex: none;
		width: 8px;
		height: 8px;
		background-color: ${Palette.badge['badge-background-level-4'].toString()};
		border-radius: 50%;
	}
`;

export const useAdministrationHighlight = () => {
	const { isHighlit: isOmnichannelHighlit } = useOmnichannelHighlight();

	return {
		isHighlit: isOmnichannelHighlit,
		get className() {
			return this.isHighlit ? highlightDot : undefined;
		},
	};
};
