import { Box } from '@rocket.chat/fuselage';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import React, { useEffect, useRef } from 'react';


export const Message = ({ msg, ...props }) => {
	const ref = useRef();

	const dataContextRef = useRef(new ReactiveDict({
		...props,
		msg: { ...msg },
	}));

	dataContextRef.current.set({
		...props,
		msg: { ...msg },
	});

	useEffect(() => {
		if (!ref.current) {
			return;
		}

		const view = Blaze.renderWithData(Template.message, () => dataContextRef.current.all(), ref.current);

		return () => {
			Blaze.remove(view);
		};
	}, []);

	return <Box ref={ref}/>;
};
