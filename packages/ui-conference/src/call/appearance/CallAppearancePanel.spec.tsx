import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CallAppearancePanel from './CallAppearancePanel';
import type { BackgroundEffectSelection } from '../../devices/BackgroundEffectContext';
import { BackgroundEffectContext, MAX_BACKGROUND_IMAGES } from '../../devices/BackgroundEffectContext';
import { buildBackgroundEffect, buildCallState } from '../../fixtures/callFixtures';
import { CallStateProvider } from '../context';

const buildEffect = (overrides: Partial<BackgroundEffectSelection> = {}) =>
	buildBackgroundEffect({ select: jest.fn(), uploadImage: jest.fn(), removeImage: jest.fn(), ...overrides });

const renderPanel = (effect: BackgroundEffectSelection | undefined) =>
	render(
		<CallStateProvider value={buildCallState()}>
			<BackgroundEffectContext.Provider value={effect}>
				<CallAppearancePanel onClose={jest.fn()} />
			</BackgroundEffectContext.Provider>
		</CallStateProvider>,
		{ wrapper: mockAppRoot().build() },
	);

it('marks the background in use', () => {
	renderPanel(buildEffect({ current: { mode: 'image', imageUrl: 'blob:beach' }, images: ['blob:forest', 'blob:beach'] }));

	expect(screen.getByRole('button', { name: 'Camera_background_image', pressed: true })).toBeInTheDocument();
	expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
	expect(screen.getByRole('button', { name: 'Camera_background_none', pressed: false })).toBeInTheDocument();
});

it('puts the picked image behind the reader', async () => {
	const effect = buildEffect({ images: ['blob:forest', 'blob:beach'] });
	renderPanel(effect);

	await userEvent.click(screen.getAllByRole('button', { name: 'Camera_background_image' })[1]);

	expect(effect.select).toHaveBeenCalledWith({ mode: 'image', imageUrl: 'blob:beach' });
});

it('removes an uploaded image', async () => {
	const effect = buildEffect({ images: ['blob:forest'] });
	renderPanel(effect);

	await userEvent.click(screen.getByRole('button', { name: 'Camera_background_remove_image' }));

	expect(effect.removeImage).toHaveBeenCalledWith('blob:forest');
});

it('uploads the chosen file', async () => {
	const effect = buildEffect();
	const { container } = renderPanel(effect);
	const file = new File(['png'], 'beach.png', { type: 'image/png' });

	// oxlint-disable-next-line testing-library/no-container, testing-library/no-node-access
	await userEvent.upload(container.querySelector('input[type=file]') as HTMLInputElement, file);

	expect(effect.uploadImage).toHaveBeenCalledWith(file);
});

it('stops offering uploads once the call holds as many images as it keeps', () => {
	renderPanel(buildEffect({ images: Array.from({ length: MAX_BACKGROUND_IMAGES }, (_, i) => `blob:${i}`) }));

	expect(screen.queryByRole('button', { name: 'Camera_background_upload_image' })).not.toBeInTheDocument();
});

// One change at a time: a second would race the first on the camera.
it('takes no other background while one is on its way', () => {
	renderPanel(buildEffect({ applying: { mode: 'blur' }, images: ['blob:forest'] }));

	for (const tile of screen.getAllByRole('button', { name: /^Camera_background_/ })) {
		expect(tile).toBeDisabled();
	}
	expect(screen.getByRole('button', { name: 'Camera_background_blur' })).toHaveAttribute('aria-busy', 'true');
});

it('says so where this browser cannot change the background', () => {
	renderPanel(buildEffect({ supported: false }));

	expect(screen.getByText('Camera_background_not_supported')).toBeInTheDocument();
	expect(screen.queryByRole('group', { name: 'Camera_background' })).not.toBeInTheDocument();
});
