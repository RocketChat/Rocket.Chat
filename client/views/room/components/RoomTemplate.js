import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import VerticalBar from '../../../components/VerticalBar';

export const RoomTemplate = ({ children, ...props }) => {
	const c = React.Children.toArray(children);
	const header = c.filter((child) => child.type === RoomTemplate.Header);
	const body = c.filter((child) => child.type === RoomTemplate.Body);
	const footer = c.filter((child) => child.type === RoomTemplate.Footer);
	const aside = c.filter((child) => child.type === RoomTemplate.Aside);


	return <Box is='main' h='full' display='flex' flexDirection='column' {...props}>
		{ header.length > 0 && header }
		<Box display='flex' flexGrow='1' overflow='hidden' height='full' position='relative'>
			<Box display='flex' flexDirection='column' flexGrow='1'>
				<Box is='div' display='flex' flexDirection='column' flexGrow='1'>{body}</Box>
				{ footer.length > 0 && <Box is='footer'>{footer}</Box> }
			</Box>
			{ aside.length > 0 && <VerticalBar is='aside' >{aside}</VerticalBar>}
		</Box>
	</Box>;
};

RoomTemplate.Header = function Header({ children }) {
	return children;
};
RoomTemplate.Body = function Body({ children }) {
	return children;
};
RoomTemplate.Footer = function Footer({ children }) {
	return children;
};
RoomTemplate.Aside = function Aside({ children }) {
	return children;
};

export default React.memo(RoomTemplate);
