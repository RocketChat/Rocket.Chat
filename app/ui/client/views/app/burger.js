import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

Template.burger = new Blaze.Template(name, () => null);

Template.burger.onRendered(() => {
	const instance = Template.instance();
	(async () => {
		const React = await import('react');
		const ReactDOM = await import('react-dom');
		const { Burger } = await import('../../../../../client/components/basic/Burger');

		instance.autorun((computation) => {
			if (computation.firstRun) {
				instance.container = instance.firstNode.parentElement;
			}

			ReactDOM.render(React.createElement(Burger), instance.container);
		});
	})();
});

Template.burger.onDestroyed(() => {
	const { container } = Template.instance();
	(async () => {
		const ReactDOM = await import('react-dom');
		if (container) {
			ReactDOM.unmountComponentAtNode(container);
		}
	})();
});
