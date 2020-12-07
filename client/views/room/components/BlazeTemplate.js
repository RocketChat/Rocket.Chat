import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import React, { useEffect, useRef } from 'react';
import { Box } from '@rocket.chat/fuselage';

export const BlazeTemplate = ({ name, children, ...props }) => {
	const ref = useRef();
	useEffect(() => {
		if (!ref.current || !Template[name]) {
			return;
		}

		let view;

		setTimeout(() => {
			view = Blaze.renderWithData(Template[name], props, ref.current);
		}, 50);

		return () => {
			Blaze.remove(view);
		};
	}, [props, name]);
	return <Box display='flex' flexDirection='column' flexGrow={1} ref={ref}/>;
};

export default React.memo(BlazeTemplate);
