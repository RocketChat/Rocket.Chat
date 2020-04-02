import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

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

		const LazyMeteorProvider = lazy(async () => {
			const { MeteorProvider } = await import('./providers/MeteorProvider');
			return { default: MeteorProvider };
		});
		const LazyComponent = lazy(importFn);
		render(
			createElement(Suspense, { fallback: null },
				createElement(LazyMeteorProvider, {},
					createElement(Suspense, { fallback: null },
						createElement(LazyComponent),
					),
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
