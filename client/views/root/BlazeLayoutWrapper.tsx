import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import React, { FC, useLayoutEffect, useMemo, useRef, CSSProperties } from 'react';
import { useSubscription } from 'use-subscription';

import { subscription } from '../../lib/portals/blazeLayout';

let unmountCount = 0;

const BlazeLayoutWrapper: FC = () => {
	const ref = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (!ref.current) {
			return;
		}

		BlazeLayout.setRoot(ref.current);

		return (): void => {
			if (++unmountCount > 1) {
				console.warn(
					'It looks like BlazeLayoutWrapper is being remounted, droping template state out.',
				);
			}

			BlazeLayout.reset();
			BlazeLayout.setRoot(null);
		};
	}, []);

	const descriptor = useSubscription(subscription);

	useLayoutEffect(() => {
		if (!descriptor) {
			BlazeLayout.reset();
			return;
		}

		BlazeLayout.render(descriptor.template, descriptor.regions);
	}, [descriptor]);

	const rootElementStyle = useMemo<CSSProperties>(
		() =>
			descriptor
				? {
						position: 'relative',
						display: 'flex',
						overflow: 'visible',
						flexDirection: 'column',
						width: '100vw',
						height: '100vh',
						padding: '0',
				  }
				: { display: 'none' },
		[descriptor],
	);

	return <div ref={ref} style={rootElementStyle} />;
};

export default BlazeLayoutWrapper;
