import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';

let rootNode;
let invalidatePortals = () => {};
const portalsMap = new Map();

const mountRoot = async () => {
	rootNode = document.getElementById('react-root');

	if (!rootNode) {
		rootNode = document.createElement('div');
		rootNode.id = 'react-root';
		document.body.appendChild(rootNode);
	}

	const [
		{ Suspense, createElement, lazy, useState },
		{ render },
	] = await Promise.all([
		import('react'),
		import('react-dom'),
	]);

	const LazyMeteorProvider = lazy(() => import('./providers/MeteorProvider'));

	function AppRoot() {
		const [portals, setPortals] = useState(() => Tracker.nonreactive(() => Array.from(portalsMap.values())));
		invalidatePortals = () => {
			setPortals(Array.from(portalsMap.values()));
		};

		return createElement(Suspense, { fallback: null },
			createElement(LazyMeteorProvider, {}, ...portals),
		);
	}

	render(createElement(AppRoot), rootNode);
};

export const registerPortal = (key, portal) => {
	if (!rootNode) {
		mountRoot();
	}

	portalsMap.set(key, portal);
	invalidatePortals();
};

export const unregisterPortal = (key) => {
	portalsMap.delete(key);
	invalidatePortals();
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

const createLazyElement = async (importFn) => {
	const { createElement, lazy } = await import('react');
	const LazyComponent = lazy(importFn);
	return createElement(LazyComponent);
};

const createLazyPortal = async (importFn, node) => {
	const { createPortal } = await import('react-dom');
	return createPortal(await createLazyElement(importFn), node);
};

export const renderRouteComponent = (importFn, { template, region } = {}) => {
	const routeName = FlowRouter.getRouteName();

	Tracker.autorun(async (computation) => {
		if (routeName !== FlowRouter.getRouteName()) {
			unregisterPortal(routeName);
			computation.stop();
			return;
		}

		if (!computation.firstRun) {
			return;
		}

		if (!template || !region) {
			BlazeLayout.reset();

			const element = await createLazyElement(importFn);

			if (routeName !== FlowRouter.getRouteName()) {
				return;
			}

			registerPortal(routeName, element);
			return;
		}

		if (!Template[routeName]) {
			const blazeTemplate = new Blaze.Template(routeName, () => HTML.DIV()); // eslint-disable-line new-cap

			blazeTemplate.onRendered(async function() {
				const portal = await createLazyPortal(importFn, this.firstNode);

				if (routeName !== FlowRouter.getRouteName()) {
					return;
				}

				registerPortal(routeName, portal);
			});

			Template[routeName] = blazeTemplate;
		}

		BlazeLayout.render(template, { [region]: routeName });
	});
};
