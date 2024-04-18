import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import React, { forwardRef } from 'react';

import { ImageGallery } from './ImageGallery';

const images = [
	{
		_id: '1',
		url: '#',
	},
	{
		_id: '2',
		url: '#',
	},
	{
		_id: '3',
		url: '#',
	},
];

jest.mock('swiper', () => ({
	Keyboard: () => null,
	Navigation: () => null,
	Zoom: () => null,
	A11y: () => null,
}));

jest.mock('swiper/react', () => ({
	Swiper: forwardRef(({ children }) => <div data-testid='swiper-testid'>{children}</div>),
	SwiperSlide: ({ children }: { children: ReactNode }) => <div data-testid='swiper-slide-testid'>{children}</div>,
}));

describe('Image Gallery', () => {
	beforeAll(() => {
		const portalEl = document.createElement('div');
		portalEl.setAttribute('id', 'portal');
		document.body.appendChild(portalEl);
	});

	it('Should render image gallery', async () => {
		render(<ImageGallery images={images} onClose={() => null} />);

		expect(await screen.findByRole('presentation')).toBeVisible;
	});

	it('Should render images', async () => {
		render(<ImageGallery images={images} onClose={() => null} />);

		expect(await screen.findAllByRole('link')).toHaveLength(3);
	});
});
