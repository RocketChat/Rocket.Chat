import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import type { ComponentType, PropsWithoutRef } from 'react';
import React, { Suspense, createElement, lazy } from 'react';
import { createPortal } from 'react-dom';

import { useReactiveValue } from '../../hooks/useReactiveValue';
import { getClosestBlazePortals } from './blazePortals';

export const createTemplateForComponent = <Props,>(
	name: string,
	factory: () => Promise<{ default: ComponentType<Props> }>,
	options:
		| {
				renderContainerView?: () => unknown;
				renderChildrenWrapper?: () => unknown;
		  }
		| {
				attachment: 'at-parent';
				props?: () => PropsWithoutRef<Props>;
		  } = {
		renderContainerView: (): unknown => HTML.DIV(),
		renderChildrenWrapper: (): unknown => HTML.DIV(),
	},
): string => {
	if (Template[name]) {
		return name;
	}

	const renderFunction =
		('renderContainerView' in options && options.renderContainerView) ||
		('attachment' in options && options.attachment === 'at-parent' && ((): unknown => HTML.Comment('anchor'))) ||
		((): unknown => HTML.DIV());

	const template = new Blaze.Template(name, renderFunction);
	template.onRendered(function (this: Blaze.TemplateInstance) {
		const reactiveProps = new ReactiveVar(this.data as PropsWithoutRef<Props>);
		this.autorun(() => {
			reactiveProps.set({
				...('props' in options && typeof options.props === 'function' && options.props()),
				...Template.currentData(),
			});
		});

		const container =
			('renderContainerView' in options && (this.firstNode as Element)) ||
			('attachment' in options && options.attachment === 'at-parent' && (this.firstNode as Node).parentElement) ||
			null;

		if (!container) {
			return;
		}

		const LazyComponent = lazy(factory);

		const currentView = this.view as Blaze.View;

		const render = (node: HTMLElement | null) => {
			currentView.templateContentBlock && node && Blaze.render(currentView.templateContentBlock, node.parentElement ?? node, node);
		};

		const InnerComponent = () => {
			return <div data-blaze-react ref={render} />;
		};

		// eslint-disable-next-line react/no-multi-comp
		const WrappedComponent = () => {
			const props = useReactiveValue(() => reactiveProps.get());
			return createElement(
				Suspense,
				{ fallback: null },
				createElement(LazyComponent, { ...props, ...(currentView.templateContentBlock && { children: <InnerComponent /> }) }),
			);
		};

		const children = createElement(WrappedComponent);

		const portal = createPortal(children, container);

		const portalsSubscription = getClosestBlazePortals(this.view as Blaze.View);
		portalsSubscription.register(this, portal);
	});

	template.onDestroyed(function (this: Blaze.TemplateInstance) {
		const portalsSubscription = getClosestBlazePortals(this.view as Blaze.View);
		portalsSubscription.unregister(this);
	});

	Template[name] = template;

	return name;
};
