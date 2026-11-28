import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { invalidFile, validFile } from '../ChatTranscript.fixtures';
import { Files } from './Files';

jest.mock('@react-pdf/renderer', () => ({
	StyleSheet: { create: () => ({ style: '' }) },
	Image: () => <img src='' alt='' />,
	Text: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	View: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('components/Files', () => {
	it('should renders file name and invalid message when buffer is null', () => {
		render(<Files files={[invalidFile]} invalidMessage='invalid' />);
		const invalidText = screen.getByText('invalid');
		const fileName = screen.getByText(invalidFile.name);

		expect(invalidText).toBeInTheDocument();
		expect(fileName).toBeInTheDocument();
	});

	it('should renders file name and image when buffer is not null', () => {
		render(<Files files={[validFile]} invalidMessage='' />);
		const image = screen.getByRole('presentation');
		const fileName = screen.getByText(validFile.name);

		expect(image).toBeInTheDocument();
		expect(fileName).toBeInTheDocument();
	});
});
