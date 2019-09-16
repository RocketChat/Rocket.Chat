import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

const onRendered = (getComponent) => () => {
	const instance = Template.instance();

	(async () => {
		const ReactDOM = await import('react-dom');
		instance.ReactDOM = ReactDOM;

		const React = await import('react');
		const component = await getComponent();

		instance.autorun((computation) => {
			if (computation.firstRun) {
				instance.container = instance.firstNode.parentElement;
			}

			const props = Template.currentData();

			ReactDOM.render(React.createElement(component, props), instance.container);
		});
	})();
};

const onDestroyed = () => {
	const { container, ReactDOM } = Template.instance();
	if (container) {
		ReactDOM.unmountComponentAtNode(container);
	}
};

Template.burger = new Blaze.Template(name, () => null);

Template.burger.onRendered(onRendered(async () => {
	const { Burger } = await import('../../../../../client/components/basic/Burger');
	return Burger;
}));

Template.burger.onDestroyed(onDestroyed);
