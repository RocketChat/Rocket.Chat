import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
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
		{ Component, Suspense, createElement, lazy, useLayoutEffect, useState },
		{ render },
	] = await Promise.all([
		import('react'),
		import('react-dom'),
	]);

	const LazyMeteorProvider = lazy(() => import('./providers/MeteorProvider'));

	class PortalWrapper extends Component {
		state = { errored: false }

		static getDerivedStateFromError = () => ({ errored: true })

		componentDidCatch = () => {}

		render = () => (this.state.errored ? null : this.props.portal)
	}

	function AppRoot() {
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
				...portals.map((portal, key) => createElement(PortalWrapper, { key, portal })),
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
	invalidatePortals();
};

export const unregisterPortal = (key) => {
	portalsMap.delete(key);
	invalidatePortals();
};

const createLazyElement = async (importFn, propsFn) => {
	const { createElement, lazy, useEffect, useState } = await import('react');
	const LazyComponent = lazy(importFn);

	if (!propsFn) {
		return createElement(LazyComponent);
	}

	const WrappedComponent = () => {
		const [props, setProps] = useState(() => Tracker.nonreactive(propsFn));

		useEffect(() => {
			const computation = Tracker.autorun(() => {
				setProps(propsFn);
			});

			return () => {
				computation.stop();
			};
		}, []);

		return createElement(LazyComponent, props);
	};

	return createElement(WrappedComponent);
};

const createLazyPortal = async (importFn, propsFn, node) => {
	const { createPortal } = await import('react-dom');
	return createPortal(await createLazyElement(importFn, propsFn), node);
};

export const createTemplateForComponent = (
	name,
	importFn,
	{
		renderContainerView = () => HTML.DIV(), // eslint-disable-line new-cap
	} = {},
) => {
	if (Template[name]) {
		return name;
	}

	const template = new Blaze.Template(name, renderContainerView);

	template.onRendered(async function() {
		const props = new ReactiveVar(this.data);
		this.autorun(() => {
			props.set(Template.currentData());
		});

		const portal = await createLazyPortal(importFn, () => props.get(), this.firstNode);

		if (!this.firstNode) {
			return;
		}

		registerPortal(this, portal);
	});

	template.onDestroyed(function() {
		unregisterPortal(this);
	});

	Template[name] = template;

	return name;
};

export const renderRouteComponent = (importFn, {
	template,
	region,
	propsFn = () => ({}),
} = {}) => {
	const routeName = FlowRouter.getRouteName();

	if (portalsMap.has(routeName)) {
		return;
	}

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

			const element = await createLazyElement(importFn, propsFn);

			if (routeName !== FlowRouter.getRouteName()) {
				return;
			}

			registerPortal(routeName, element);
			return;
		}

		if (!Template[routeName]) {
			const blazeTemplate = new Blaze.Template(routeName, () => HTML.DIV()); // eslint-disable-line new-cap

			blazeTemplate.onRendered(async function() {
				const node = this.firstNode.parentElement;
				this.firstNode.remove();
				const portal = await createLazyPortal(importFn, propsFn, node);

				if (routeName !== FlowRouter.getRouteName()) {
					return;
				}

				registerPortal(routeName, portal);

				const handleMainContentDestroyed = () => {
					unregisterPortal(routeName);
					document.removeEventListener('main-content-destroyed', handleMainContentDestroyed);
				};

				document.addEventListener('main-content-destroyed', handleMainContentDestroyed);
			});

			Template[routeName] = blazeTemplate;
		}

		BlazeLayout.render(template, { [region]: routeName });
	});
};
