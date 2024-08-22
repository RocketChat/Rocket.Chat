import { h, render } from 'preact';

const root = document.getElementById('app') ?? document.body.firstElementChild;

if (!root) {
	throw new Error('No root element found');
}

const init = async () => {
	const { default: App } = await import('./index');
	render(h(App, {}), document.body, root);
};

if (module.hot) {
	module.hot.accept();
}

init();
