import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import React from 'react';

type ContainerProps = {
	children: ReactNode;
	secondary?: boolean;
};

const containerClassName = css`
	position: fixed;
	display: flex;
	flex-direction: column;
	max-width: 250px;
	min-height: 128px;
	border-radius: 4px;
	border: 1px solid ${Palette.stroke['stroke-dark'].toString()};
	bottom: 132px;
	right: 24px;
	z-index: 99;
`;

const VoiceCallContainer = ({ children, secondary = false }: ContainerProps) => {
	return (
		<Box is='section' className={containerClassName} backgroundColor={secondary ? 'surface-neutral' : 'surface-light'}>
			{children}
		</Box>
	);
};

export default VoiceCallContainer;
