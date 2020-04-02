import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
// import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';

let rootNode;
const portalsMap = new Map();
const portalsDep = new Tracker.Dependency();

const mountRoot = async () => {
	rootNode = document.getElementById('react-root');

	if (!rootNode) {
		rootNode = document.createElement('div');
		rootNode.id = 'react-root';
		document.body.appendChild(rootNode);
	}

	const [
		{ Suspense, createElement, lazy, useEffect, useState },
		{ render },
	] = await Promise.all([
		import('react'),
		import('react-dom'),
	]);

	const LazyMeteorProvider = lazy(() => import('./providers/MeteorProvider'));

	function AppRoot() {
		const [portals, setPortals] = useState(() => Tracker.nonreactive(() => Array.from(portalsMap.values())));

		useEffect(() => {
			const computation = Tracker.autorun(() => {
				portalsDep.depend();
				setPortals(() => Array.from(portalsMap.values()));
			});

			return () => {
				computation.stop();
			};
		}, []);

		return createElement(Suspense, { fallback: null },
			createElement(LazyMeteorProvider, {},
				...portals,
			),
		);
	}

	render(createElement(AppRoot), rootNode);
};

export const registerPortal = (key, portal) => {
	if (!rootNode) {
		mountRoot();
	}

	portalsMap.set(key, portal);
	portalsDep.changed();
};

export const unregisterPortal = (key) => {
	portalsMap.delete(key);
	portalsDep.changed();
};

export const createTemplateForComponent = (
	importFn,
	{
		name = Math.random().toString(36).slice(2),
		// eslint-disable-next-line new-cap
		renderContainerView = () => HTML.DIV(),
		routeName,
	} = {},
) => {
	if (Template[name]) {
		return name;
	}

	const template = new Blaze.Template(name, renderContainerView);

	template.onRendered(async function() {
		const [
			{ createElement, lazy, Suspense },
			{ render, unmountComponentAtNode },
		] = await Promise.all([
			import('react'),
			import('react-dom'),
		]);

		const { firstNode } = this;

		if (!firstNode) {
			return;
		}

		const LazyMeteorProvider = lazy(() => import('./providers/MeteorProvider'));
		const LazyComponent = lazy(importFn);
		render(
			createElement(Suspense, { fallback: null },
				createElement(LazyMeteorProvider, {},
					createElement(LazyComponent),
				),
			), firstNode);

		this.unmount = () => {
			unmountComponentAtNode(firstNode);
		};

		routeName && this.autorun(() => {
			if (FlowRouter.getRouteName() !== routeName) {
				this.unmount();
			}
		});
	});

	template.onDestroyed(async function() {
		this.unmount && this.unmount();
	});

	Template[name] = template;

	return name;
};

const createConnectedElement = async (importFn) => {
	const { createElement, lazy, Suspense } = await import('react');

	const LazyMeteorProvider = lazy(() => import('./providers/MeteorProvider'));
	const LazyComponent = lazy(importFn);

	return createElement(Suspense, { fallback: null },
		createElement(LazyMeteorProvider, {},
			createElement(LazyComponent),
		),
	);
};

export const renderRouteComponent = (importFn) => {
	const routeName = FlowRouter.getRouteName();
	const key = Symbol();

	Tracker.autorun(async (computation) => {
		if (routeName !== FlowRouter.getRouteName()) {
			unregisterPortal(key);
			computation.stop();
			return;
		}

		if (computation.firstRun) {
			registerPortal(key, await createConnectedElement(importFn));
		}
	});
};
