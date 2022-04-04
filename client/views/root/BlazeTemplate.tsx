import { Blaze } from 'meteor/blaze';
import { EJSONable } from 'meteor/ejson';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Template } from 'meteor/templating';
import React, { FC, useEffect, useRef } from 'react';

type BlazeTemplateProps = {
	template: keyof typeof Template;
	data?: EJSONable;
};

const hiddenStyle = { display: 'none' } as const;

const BlazeTemplate: FC<BlazeTemplateProps> = ({ template, data }) => {
	const ref = useRef<HTMLDivElement>(null);
	const dataRef = useRef(new ReactiveDict());

	useEffect(() => {
		if (data) {
			dataRef.current.set(data);
		}
	});

	useEffect(() => {
		if (!ref.current || !ref.current.parentNode) {
			return;
		}

		const data = dataRef.current;

		const view = Blaze.renderWithData(Template[template], () => data.all(), ref.current.parentNode, ref.current);

		return (): void => {
			Blaze.remove(view);
		};
	}, [template]);

	return <div ref={ref} data-blaze-template style={hiddenStyle} />;
};

export default BlazeTemplate;
