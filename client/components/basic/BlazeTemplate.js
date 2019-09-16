import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import React, { useEffect, useRef } from 'react';


export function BlazeTemplate({ name, template, data }) {
	const anchorRef = useRef();

	const blazeTemplate = template || Template[name];

	useEffect(() => {
		if (!blazeTemplate) {
			return;
		}

		const renderedView = Blaze.renderWithData(blazeTemplate, data, anchorRef.current.parentElement, anchorRef.current);

		return () => {
			Blaze.remove(renderedView);
		};
	}, [blazeTemplate]);

	return <div ref={anchorRef} style={{ display: 'none' }} />;
}
