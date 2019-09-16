import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { Template } from 'meteor/templating';

// eslint-disable-next-line new-cap
Template.burger = new Blaze.Template(name, () => HTML.DIV());

Template.burger.onRendered(() => {
	const instance = Template.instance();
	(async () => {
		const React = await import('react');
		const ReactDOM = await import('react-dom');
		const { Burger } = await import('../../../../../client/components/basic/Burger');

		instance.autorun((computation) => {
			if (computation.firstRun) {
				instance.container = instance.firstNode;
			}

			ReactDOM.render(React.createElement(Burger), instance.firstNode);
		});
	})();
});

Template.burger.onDestroyed(() => {
	const instance = Template.instance();
	(async () => {
		const ReactDOM = await import('react-dom');
		if (instance.container) {
			ReactDOM.unmountComponentAtNode(instance.container);
		}
	})();
});
