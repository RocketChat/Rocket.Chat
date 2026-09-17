import { Palette } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';

type WidgetBaseProps = { inline?: boolean; borderless?: boolean };

const WidgetBase = styled('div', ({ borderless: _borderless, inline: _inline, ...props }: WidgetBaseProps) => props)`
	padding: 0;
	display: flex;
	flex-direction: column;
	width: 248px;
	min-height: 128px;
	border-radius: 4px;
	background-color: ${Palette.surface['surface-tint'].toString()};
	color: ${Palette.text['font-default'].toString()};
	overflow: hidden;

	${({ borderless }) =>
		borderless
			? ''
			: `
        border: 1px solid ${Palette.stroke['stroke-dark'].toString()};
    `}

	${({ inline }) =>
		inline
			? ''
			: `
        position: fixed;
        right: 2em;
        top: 11em;
        z-index: 100;
        box-shadow:
            0px 0px 1px 0px ${Palette.shadow['shadow-elevation-2x'].toString()},
            0px 0px 12px 0px ${Palette.shadow['shadow-elevation-2y'].toString()};
    `}
`;

export default WidgetBase;
