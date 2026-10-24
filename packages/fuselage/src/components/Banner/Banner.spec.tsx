import { screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import Banner from './Banner';
import { withResizeObserverMock } from '../../../mocks/withResizeObserverMock';
import { render } from '../../testing';

expect.extend(toHaveNoViolations);

withResizeObserverMock();

describe('[Banner Component]', () => {
	it('renders without crashing', () => {
		render(<Banner />);
	});

	it('renders with link', () => {
		render(<Banner link='https://rocket.chat' linkText='More info' />);
		expect(
			screen.getByRole('link', {
				name: /more info/i,
			}),
		).toBeInTheDocument();
	});

	it('does not have role="banner" or tabIndex when non-actionable', () => {
		render(
			<Banner data-testid='banner' title='Title'>
				Body
			</Banner>,
		);
		expect(screen.queryByRole('banner')).not.toBeInTheDocument();
		const bannerElement = screen.getByTestId('banner');
		expect(bannerElement).not.toHaveAttribute('role');
		expect(bannerElement).not.toHaveAttribute('tabindex');
	});

	it('has role="button" and tabIndex="0" when actionable with onAction', () => {
		const onAction = jest.fn();
		render(
			<Banner onAction={onAction} title='Title'>
				Body
			</Banner>,
		);
		const bannerElement = screen.getByRole('button');
		expect(bannerElement).toHaveAttribute('tabindex', '0');
	});

	it('allows custom role to be passed via props', () => {
		render(
			<Banner role='status' title='Title'>
				Body
			</Banner>,
		);
		expect(screen.getByRole('status')).toBeInTheDocument();
	});

	it('should not have duplicate banner landmark violations when multiple banners are rendered', async () => {
		const { container } = render(
			<div>
				<Banner title='First Banner'>First content</Banner>
				<Banner title='Second Banner'>Second content</Banner>
			</div>,
		);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
