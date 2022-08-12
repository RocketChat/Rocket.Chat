import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import type { ComponentType, PropsWithoutRef } from 'react';

import { blazePortals } from './blazePortals';
import { createLazyPortal } from './createLazyPortal';

export const createTemplateForComponent = <Props>(
	name: string,
	factory: () => Promise<{ default: ComponentType<Props> }>,
	options:
		| {
				renderContainerView?: () => unknown;
		  }
		| {
				attachment: 'at-parent';
				props?: () => PropsWithoutRef<Props>;
		  } = {
		renderContainerView: (): unknown => HTML.DIV(),
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
		const props = new ReactiveVar(this.data as PropsWithoutRef<Props>);
		this.autorun(() => {
			props.set({
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

		const portal = createLazyPortal(factory, () => props.get(), container);

		blazePortals.register(this, portal);
	});

	template.onDestroyed(function (this: Blaze.TemplateInstance) {
		blazePortals.unregister(this);
	});

	Template[name] = template;

	return name;
};
