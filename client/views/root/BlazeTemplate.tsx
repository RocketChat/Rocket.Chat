import { Blaze } from 'meteor/blaze';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Template } from 'meteor/templating';
import React, { FC, useLayoutEffect, useRef } from 'react';

type BlazeTemplateProps = {
	children?: never;
	template: keyof typeof Template;
	data?: Record<string, unknown>;
};

const hiddenStyle = { display: 'none' } as const;

const BlazeTemplate: FC<BlazeTemplateProps> = ({ template, data }) => {
	const ref = useRef<HTMLDivElement>(null);
	const dataRef = useRef(new ReactiveDict());

	useLayoutEffect(() => {
		dataRef.current.set(data);
	}, [data]);

	useLayoutEffect(() => {
		if (!ref.current || !ref.current.parentNode) {
			return;
		}

		const data = dataRef.current;

		const view = Blaze.renderWithData(
			Template[template],
			() => data.all(),
			ref.current.parentNode,
			ref.current,
		);

		return (): void => {
			Blaze.remove(view);
		};
	}, [template]);

	return <div ref={ref} style={hiddenStyle} />;
};

export default BlazeTemplate;
