import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';
import flattenChildren from 'react-keyed-flatten-children';

import VerticalBar from '../../../components/VerticalBar';

export const RoomTemplate: FC & {
	Header: FC;
	Body: FC;
	Footer: FC;
	Aside: FC;
} = ({ children, ...props }) => {
	const c = flattenChildren(children);
	const header = c.filter((child) => (child as any).type === RoomTemplate.Header);
	const body = c.filter((child) => (child as any).type === RoomTemplate.Body);
	const footer = c.filter((child) => (child as any).type === RoomTemplate.Footer);
	const aside = c.filter((child) => (child as any).type === RoomTemplate.Aside);

	return (
		<Box is='main' h='full' display='flex' flexDirection='column' {...props}>
			{header.length > 0 && header}
			<Box display='flex' flexGrow={1} overflow='hidden' height='full' position='relative'>
				<Box display='flex' flexDirection='column' flexGrow={1}>
					<Box is='div' display='flex' flexDirection='column' flexGrow={1}>
						{body}
					</Box>
					{footer.length > 0 && <Box is='footer'>{footer}</Box>}
				</Box>
				{aside.length > 0 && <VerticalBar is='aside'>{aside}</VerticalBar>}
			</Box>
		</Box>
	);
};

// eslint-disable-next-line react/no-multi-comp
const Header: FC = function Header({ children }) {
	return <>{children}</>;
};

// eslint-disable-next-line react/no-multi-comp
const Body: FC = function Body({ children }) {
	return <>{children}</>;
};

// eslint-disable-next-line react/no-multi-comp
const Footer: FC = function Footer({ children }) {
	return <>{children}</>;
};
// eslint-disable-next-line react/no-multi-comp
const Aside: FC = function Aside({ children }) {
	return <>{children}</>;
};

RoomTemplate.Header = Header;
RoomTemplate.Body = Body;
RoomTemplate.Footer = Footer;
RoomTemplate.Aside = Aside;

export default RoomTemplate;
