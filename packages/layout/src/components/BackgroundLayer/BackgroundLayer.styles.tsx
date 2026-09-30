import styled from '@rocket.chat/styled';

const filterWrapperProps = ({
	backgroundColor: _backgroundColor,
	color: _color,
	backgroundImage: _backgroundImage,
	...props
}: {
	backgroundColor: string;
	color: string;
	backgroundImage: string;
}) => props;

export const Wrapper = styled('div', filterWrapperProps)`
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	width: 100vw;
	min-height: 100vh;
	background-image: url('${(p) => p.backgroundImage}');
	background-repeat: no-repeat;
	background-position: center;
	background-size: cover;
	overflow: auto;
	color: ${(p) => p.color};
`;
