import { css } from '@rocket.chat/css-in-js';
import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { AnimatedVisibility } from '../components/AnimatedVisibility';
import { Box } from '../components/Box';
import { Margins } from '../components/Margins';
import { PaletteStyleTag } from '../components/PaletteStyleTag';
import { Scrollable } from '../components/Scrollable';
import { OwnerDocument } from '../contexts';
import { render } from '../testing';
import { useStyle } from './useStyle';

// React Native has no document, so the context default is undefined there.
const withoutDocument = (children: ReactNode) => (
	<OwnerDocument.Provider value={{ document: undefined as unknown as Document }}>{children}</OwnerDocument.Provider>
);

const Styled = () => {
	const className = useStyle(css`
		color: red;
	`);
	return <div className={className}>styled</div>;
};

describe('without a document', () => {
	it('useStyle keeps the class name and injects nothing', () => {
		const before = document.querySelectorAll('style').length;
		render(withoutDocument(<Styled />));
		expect(screen.getByText('styled').className).toMatch(/\S/);
		expect(document.querySelectorAll('style')).toHaveLength(before);
	});

	it('renders AnimatedVisibility', () => {
		render(
			withoutDocument(
				<AnimatedVisibility visibility={AnimatedVisibility.VISIBLE}>
					<Box>Content</Box>
				</AnimatedVisibility>,
			),
		);
		expect(screen.getByText('Content')).toBeInTheDocument();
	});

	it('renders Margins', () => {
		render(
			withoutDocument(
				<Margins all='x8'>
					<div>Content</div>
				</Margins>,
			),
		);
		expect(screen.getByText('Content')).toBeInTheDocument();
	});

	it('renders Scrollable', () => {
		render(
			withoutDocument(
				<Scrollable vertical>
					<div>Content</div>
				</Scrollable>,
			),
		);
		expect(screen.getByText('Content')).toBeInTheDocument();
	});

	it('renders nothing for PaletteStyleTag', () => {
		expect(() => render(withoutDocument(<PaletteStyleTag tagId='no-document-palette' />))).not.toThrow();
		expect(document.getElementById('no-document-palette')).toBeNull();
	});
});
