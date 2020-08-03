import React, { useEffect, useRef } from 'react';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { Box } from '@rocket.chat/fuselage';

const TemplateComponent = ({ template, templateOptions, ...props }) => {
	const ref = useRef();

	console.log(props.get());

	useEffect(() => {
		Object.entries(templateOptions).forEach(([key, val]) => { Template[template][key](val); });
	}, [template, templateOptions]);

	useEffect(() => {
		const view = ref.current && Blaze.renderWithData(Template[template], props, ref.current);
		return () => view && Blaze.remove(view);
	}, [props, template]);

	return <div ref={ref}></div>;
};

export default TemplateComponent;
