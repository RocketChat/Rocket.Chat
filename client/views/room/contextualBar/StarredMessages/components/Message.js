import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import React, { useEffect, useRef } from 'react';
import { Box } from '@rocket.chat/fuselage';

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

	return <Box ref={ref}/>;
};

export const Message = (props) => <BlazeTemplate name='message' {...props} />;
