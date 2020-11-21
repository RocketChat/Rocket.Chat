import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import React, { useEffect, useRef } from 'react';
import { Box } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import Header from './Header';
import { RocketChatTabBar } from '../../../app/ui-utils/client';

export const Room = ({ children, ...props }) => {
	const c = React.Children.toArray(children);
	const header = c.filter((child) => child.type === Room.Header);
	const body = c.filter((child) => child.type === Room.Body);
	const footer = c.filter((child) => child.type === Room.Footer);
	const aside = c.filter((child) => child.type === Room.Aside);

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

Room.Header = function({ children }) {
	return children;
};
Room.Body = function({ children }) {
	return children;
};
Room.Footer = function({ children }) {
	return children;
};
Room.Aside = function({ children }) {
	return children;
};

const BlazeTemplate = ({ name, children, ...props }) => {
	const ref = useRef();
	useEffect(() => {
		if (!ref.current) {
			return;
		}

		const view = Blaze.renderWithData(Template[name], props, ref.current);

		return () => {
			Blaze.remove(view);
		};
	}, [props, name]);
	return <Box display='flex' flexDirection='column' flexGrow={1} ref={ref}/>;
};

export default (props) => {
	const t = useTranslation();
	const tabBar = new RocketChatTabBar();
	return <Room aria-label={t('Channel')} data-qa-rc-room={props._id}>
		<Room.Header><Header tabBar={tabBar} rid={props._id}></Header></Room.Header>
		<Room.Body><BlazeTemplate name='roomOld' tabBar={tabBar} {...props} /></Room.Body>
	</Room>;
};
