import { act, render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { Suspense } from 'react';

import { preloadedLazy } from './preloadedLazy';

const Content = () => <p>content</p>;

const renderInSuspense = (Component: ComponentType) =>
	render(
		<Suspense fallback={<p>fallback</p>}>
			<Component />
		</Suspense>,
	);

it('renders without showing the fallback once its module has loaded', async () => {
	const Lazy = preloadedLazy(() => Promise.resolve({ default: Content }));
	await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

	renderInSuspense(Lazy);

	expect(screen.getByText('content')).toBeInTheDocument();
	expect(screen.queryByText('fallback')).not.toBeInTheDocument();
});

it('shows the fallback while its module is still loading', async () => {
	let finishLoading: (module: { default: typeof Content }) => void = () => undefined;
	const Lazy = preloadedLazy(
		() =>
			new Promise<{ default: typeof Content }>((resolve) => {
				finishLoading = resolve;
			}),
	);

	renderInSuspense(Lazy);
	expect(screen.getByText('fallback')).toBeInTheDocument();

	await act(async () => finishLoading({ default: Content }));
	expect(await screen.findByText('content')).toBeInTheDocument();
});
