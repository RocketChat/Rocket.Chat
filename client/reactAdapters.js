import { Emitter } from '@rocket.chat/emitter';
import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { Random } from 'meteor/random';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';

const createPortalsSubscription = () => {
	const portalsMap = new Map();
	const emitter = new Emitter();

	return {
		getCurrentValue: () => Array.from(portalsMap.values()),
		subscribe: (callback) => emitter.on('update', callback),
		delete: (key) => {
			portalsMap.delete(key);
			emitter.emit('update');
		},
		set: (key, portal) => {
			portalsMap.set(key, { portal, key: Random.id() });
			emitter.emit('update');
		},
		has: (key) => portalsMap.has(key),
	};
};

export const portalsSubscription = createPortalsSubscription();

let rootNode;

export const mountRoot = async () => {
	if (rootNode) {
		return;
	}

	rootNode = document.getElementById('react-root');

	if (!rootNode) {
		rootNode = document.createElement('div');
		rootNode.id = 'react-root';
		document.body.insertBefore(rootNode, document.body.firstChild);
	}

	const [
		{ Suspense, createElement, lazy },
		{ render },
	] = await Promise.all([
		import('react'),
		import('react-dom'),
	]);

	const LazyAppRoot = lazy(() => import('./components/AppRoot'));

	render(createElement(Suspense, { fallback: null }, createElement(LazyAppRoot)), rootNode);
};

const unregisterPortal = (key) => {
	portalsSubscription.delete(key);
};

export const registerPortal = (key, portal) => {
	mountRoot();
	portalsSubscription.set(key, portal);
	return () => unregisterPortal(key);
};

const createLazyElement = async (importFn, propsFn) => {
	const { createElement, lazy, useEffect, useState, memo, Suspense } = await import('react');
	const LazyComponent = lazy(importFn);

	if (!propsFn) {
		return createElement(LazyComponent);
	}

	const WrappedComponent = memo(() => {
		const [props, setProps] = useState(() => Tracker.nonreactive(propsFn));

		useEffect(() => {
			const computation = Tracker.autorun(() => {
				setProps(propsFn());
			});

			return () => {
				computation.stop();
			};
		}, []);

		return createElement(Suspense, { fallback: null }, createElement(LazyComponent, props));
	});

	return createElement(WrappedComponent);
};

const createLazyPortal = async (importFn, propsFn, node) => {
	const { createPortal } = await import('react-dom');
	return createPortal(await createLazyElement(importFn, propsFn), node);
};

export const createEphemeralPortal = async (importFn, propsFn, node) => {
	const portal = await createLazyPortal(importFn, propsFn, node);
	return registerPortal(node, portal);
};

const unregister = Symbol('unregister');

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

		this[unregister] = await registerPortal(this, portal);
	});

	template.onDestroyed(function() {
		this[unregister]?.();
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

	if (portalsSubscription.has(routeName)) {
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

		Tracker.afterFlush(() => {
			BlazeLayout.render(template, { [region]: routeName });
		});
	});
};
