import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import type { ComponentType, PropsWithoutRef } from 'react';

import { blazePortals } from './blazePortals';
import { createLazyPortal } from './createLazyPortal';

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
	template.onRendered(function (this: Blaze.TemplateInstance) {
		const props = new ReactiveVar(this.data as PropsWithoutRef<Props>);
		this.autorun(() => {
			props.set(Template.currentData());
		});

		const portal = createLazyPortal(factory, () => props.get(), this.firstNode as Element);

		blazePortals.register(this, portal);
	});

	template.onDestroyed(function (this: Blaze.TemplateInstance) {
		blazePortals.unregister(this);
	});

	Template[name] = template;

	return name;
};
