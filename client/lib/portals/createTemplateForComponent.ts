import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import type { ComponentType, PropsWithoutRef } from 'react';

import { createLazyPortal } from './createLazyPortal';
import { registerPortal } from './portalsSubscription';

const unregister = Symbol('unregister');

export const createTemplateForComponent = <Props extends {} = {}>(
	name: string,
	factory: () => Promise<{ default: ComponentType<Props> }>,
	{
		renderContainerView = (): unknown => HTML.DIV(), // eslint-disable-line new-cap
	} = {},
): string => {
	if (Template[name]) {
		return name;
	}

	const template = new Blaze.Template(name, renderContainerView);
	template.onRendered(function (this: Blaze.TemplateInstance & Record<typeof unregister, unknown>) {
		const props = new ReactiveVar(this.data as PropsWithoutRef<Props>);
		this.autorun(() => {
			props.set(Template.currentData());
		});

		const portal = createLazyPortal(factory, () => props.get(), this.firstNode as Element);

		if (!this.firstNode) {
			return;
		}

		this[unregister] = registerPortal(this, portal);
	});

	template.onDestroyed(function (
		this: Blaze.TemplateInstance & Record<typeof unregister, () => void | undefined>,
	) {
		this[unregister]?.();
	});

	Template[name] = template;

	return name;
};
