import { h, render } from 'preact';

let root = document.getElementById('app') || document.body.firstElementChild;

const init = async () => {
	const { default: App } = await import('./index');
	root = render(h(App), document.body, root);
};

if (module.hot) {
	module.hot.accept('./index', init);
}

init();
