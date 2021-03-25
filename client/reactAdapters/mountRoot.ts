import { portalsSubscription } from './portalsSubscription';

export { portalsSubscription };

let rootNode: HTMLElement | null;

export const mountRoot = async (): Promise<void> => {
	if (rootNode) {
		return;
	}

	rootNode = document.getElementById('react-root');

	if (!rootNode) {
		rootNode = document.createElement('div');
		rootNode.id = 'react-root';
		document.body.insertBefore(rootNode, document.body.firstChild);
	}

	const [
		{ Suspense, createElement, lazy },
		{ render },
	] = await Promise.all([
		import('react'),
		import('react-dom'),
	]);

	const LazyAppRoot = lazy(() => import('../components/AppRoot'));

	render(createElement(Suspense, { fallback: null }, createElement(LazyAppRoot)), rootNode);
};
