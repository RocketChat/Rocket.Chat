import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { Random } from 'meteor/random';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import React, { useState } from 'react';

import { portalsMap } from '../reactAdapters';

const AppRoot = () => {
	const [portals, setPortals] = useState(() => Tracker.nonreactive(() => Array.from(portalsMap.values())));

	useLayoutEffect(() => {
		invalidatePortals = () => {
			setPortals(Array.from(portalsMap.values()));
		};
		invalidatePortals();

		return () => {
			invalidatePortals = () => {};
		};
	}, []);

	return createElement(Suspense, { fallback: null },
		createElement(LazyMeteorProvider, {},
			portals.map(({ key, portal }) => createElement(PortalWrapper, { key, portal })),
		),
	);
};

export default AppRoot;
