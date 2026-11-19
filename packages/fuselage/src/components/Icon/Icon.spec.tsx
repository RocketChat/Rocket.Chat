import nameToCharacterMapping from '@rocket.chat/icons';
import { screen } from '@testing-library/react';

import { Icon, type IconProps } from '.';
import type { IconContract } from './Icon.contract';
import { render } from '../../testing';

describe('[Icon Component]', () => {
	it('renders the glyph of its name, hidden from assistive technology', () => {
		render(<Icon name='chat' testID='icon' />);

		expect(screen.getByTestId('icon')).toHaveTextContent(nameToCharacterMapping.chat);
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
	});

	it('is an image with a name when the caller says so', () => {
		render(<Icon name='warning' role='img' aria-hidden={false} aria-label='Warning' />);

		expect(screen.getByRole('img', { name: 'Warning' })).toBeInTheDocument();
	});

	it('takes a step of the scale by its name or by its pixels', () => {
		render(
			<>
				<Icon name='chat' testID='named' size='x24' />
				<Icon name='chat' testID='pixels' size={24} />
				<Icon name='chat' testID='other' size='x16' />
			</>,
		);

		expect(screen.getByTestId('pixels').className).toEqual(screen.getByTestId('named').className);
		expect(screen.getByTestId('other').className).not.toEqual(screen.getByTestId('named').className);
	});

	it('declares a neutral contract the web props extend', () => {
		const props: IconProps = {
			'name': 'chat',
			'size': 'x20',
			'color': 'danger',
			'aria-label': 'Chat',
			'testID': 'icon',
			'className': 'mine',
		};
		const contract: IconContract = props;
		// @ts-expect-error a size outside the scale
		const offScale: IconContract = { name: 'chat', size: '60px' };
		// @ts-expect-error `className` is a web attribute
		const withClassName: IconContract = { name: 'chat', className: 'mine' };
		// @ts-expect-error a press is not part of a glyph
		const withClick: IconContract = { name: 'chat', onClick: () => undefined };

		expect([contract, offScale, withClassName, withClick]).toHaveLength(4);
	});
});
