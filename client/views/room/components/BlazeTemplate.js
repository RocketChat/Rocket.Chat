import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import React, { useLayoutEffect, useRef } from 'react';
import { Box } from '@rocket.chat/fuselage';

export const BlazeTemplate = React.memo(({ name, flexShrink, overflow, onClick, children, ...props }) => {
	const ref = useRef();
	useLayoutEffect(() => {
		if (!ref.current || !Template[name]) {
			return;
		}

		let view;

		const timeout = setTimeout(() => {
			view = Blaze.renderWithData(Template[name], props, ref.current);
		}, 10);

		return () => {
			clearTimeout(timeout);
			view && Blaze.remove(view);
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [name]);
	return <Box rcx-blaze-template display='flex' onClick={onClick} flexDirection='column' flexGrow={1} ref={ref} { ...{ flexShrink, overflow }}/>;
});

export default React.memo(BlazeTemplate);
