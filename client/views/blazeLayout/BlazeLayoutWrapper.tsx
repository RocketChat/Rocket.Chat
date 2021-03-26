import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import React, { FC, useEffect, useLayoutEffect, useRef } from 'react';

import { subscription, BlazeLayoutDescriptor } from '../../lib/portals/blazeLayout';

const BlazeLayoutWrapper: FC = () => {
	const ref = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (!ref.current) {
			return;
		}

		BlazeLayout.setRoot(ref.current);
	}, []);

	useEffect(() => {
		const update = (descriptor: BlazeLayoutDescriptor | null): void => {
			if (!descriptor) {
				BlazeLayout.reset();
				return;
			}

			BlazeLayout.render(descriptor.template, descriptor.regions);
		};

		update(subscription.getCurrentValue());

		return subscription.subscribe(() => {
			update(subscription.getCurrentValue());
		});
	}, []);

	return (
		<div
			ref={ref}
			style={{
				position: 'relative',
				display: 'flex',
				overflow: 'visible',
				flexDirection: 'column',
				width: '100vw',
				height: '100vh',
				padding: '0',
			}}
		/>
	);
};

export default BlazeLayoutWrapper;
