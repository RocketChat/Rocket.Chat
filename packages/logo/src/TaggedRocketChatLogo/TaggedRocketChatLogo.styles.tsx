import styled from '@rocket.chat/styled';

const tagStyleProps = ({ color: _color, backgroundColor: _backgroundColor, ...props }: { color: string; backgroundColor: string }) => props;

const containerProps = ({ width: _width, ...props }: { width?: string }) => props;

export const LogoContainer = styled('div', containerProps)`
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

export const LogoTag = styled('div', tagStyleProps)`
	border-radius: 90px;
	margin: 0;
	margin-inline-start: 0.5rem;
	font-size: 8px;
	font-weight: 700;
	line-height: 100%;
	padding: 3px 8px;
	text-align: center;
	color: ${(p) => p.color};
	background-color: ${(p) => p.backgroundColor};
	border-width: 0;
	border-style: solid;
	border-color: currentColor;
	outline: none;
`;
