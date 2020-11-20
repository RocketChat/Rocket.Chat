import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import React, { useEffect, useRef } from 'react';
import { Box } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';

function Header({ children }) {
	return children;
}

function Body({ children }) {
	return children;
}

function Footer({ children }) {
	return children;
}

function Aside({ children }) {
	return children;
}

export const Room = ({ children, ...props }) => {
	const c = React.Children.toArray(children);
	const header = c.filter((child) => child.type === Header);
	const body = c.filter((child) => child.type === Body);
	const footer = c.filter((child) => child.type === Footer);
	const aside = c.filter((child) => child.type === Aside);

	return <Box is='main' h='full' display='flex' flexDirection='column' {...props}>
		{ header.length > 0 && <Box is='header'>{header}</Box> }
		<Box display='flex' flexGrow='1'>
			<Box display='flex' flexDirection='column' flexGrow='1'>
				<Box is='div' display='flex' flexDirection='column' flexGrow='1'>{body}</Box>
				{ footer.length > 0 && <Box is='footer'>{footer}</Box> }
			</Box>
			{ aside.length > 0 && <Box is='aside'>{aside}</Box>}
		</Box>
	</Box>;
};

Room.Header = Header;
Room.Body = Body;
Room.Footer = Footer;
Room.Aside = Aside;

const RoomBlazeTemplate = ({ children, ...props }) => {
	const ref = useRef();
	useEffect(() => {
		if (!ref.current) {
			return;
		}

		const view = Blaze.renderWithData(Template.roomOld, props, ref.current);

		return () => {
			Blaze.remove(view);
		};
	}, [props]);
	return <Box display='flex' flexDirection='column' flexGrow={1} ref={ref}/>;
};

export default (props) => {
	const t = useTranslation();
	return <Room aria-label={t('Channel')} data-qa-rc-room={props._id}>
		<Room.Body><RoomBlazeTemplate {...props} /></Room.Body>
	</Room>;
};
