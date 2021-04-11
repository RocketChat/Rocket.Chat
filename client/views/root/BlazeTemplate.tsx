import { Blaze } from 'meteor/blaze';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Template } from 'meteor/templating';
import React, { FC, Fragment, useEffect, useRef } from 'react';
import { useSubscription } from 'use-subscription';

import { blazePortals } from '../../lib/portals/blazePortals';

type BlazeTemplateProps = {
	template: keyof typeof Template;
	data?: Record<string, unknown>;
};

const hiddenStyle = { display: 'none' } as const;

const BlazeTemplate: FC<BlazeTemplateProps> = ({ template, data }) => {
	const ref = useRef<HTMLDivElement>(null);
	const dataRef = useRef(new ReactiveDict());
	const portals = useSubscription(blazePortals);

	useEffect(() => {
		dataRef.current.set(data);
	});

	useEffect(() => {
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

	return (
		<>
			<div ref={ref} style={hiddenStyle} />
			{portals.map(({ key, node }) => (
				<Fragment key={key} children={node} />
			))}
		</>
	);
};

export default BlazeTemplate;
