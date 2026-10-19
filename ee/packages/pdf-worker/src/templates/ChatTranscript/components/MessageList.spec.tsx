import { render, screen } from '@testing-library/react';

import { invalidFile, validFile, validMessage, validSystemMessage } from '../ChatTranscript.fixtures';
import { MessageList } from './MessageList';

jest.mock('@react-pdf/renderer', () => ({
	Image: () => <div>Image</div>,
	StyleSheet: { create: () => ({ style: '' }) },
	Text: ({ children }: { children: string }) => <div>{children}</div>,
	View: ({ children }: { children: string }) => <div>{children}</div>,
	Files: ({ children }: { children: string }) => <div>{children}</div>,
}));

describe('components/MessageList', () => {
	it('should render correctly', () => {
		render(<MessageList messages={[validMessage]} invalidFileMessage='' />);
		expect(screen.getByText(validMessage.msg)).toBeInTheDocument();
	});

	it('should render divider', () => {
		render(<MessageList messages={[{ ...validMessage, divider: 'divider' }]} invalidFileMessage='' />);
		expect(screen.getByText(validMessage.msg)).toBeInTheDocument();
		expect(screen.getByText('divider')).toBeInTheDocument();
	});

	it('should render file', () => {
		render(<MessageList messages={[{ ...validMessage, files: [validFile] }]} invalidFileMessage='' />);
		expect(screen.getByText(validMessage.msg)).toBeInTheDocument();
		expect(screen.getByText(validFile.name)).toBeInTheDocument();
	});

	it('should render invalid file message', () => {
		render(<MessageList messages={[{ ...validMessage, files: [invalidFile] }]} invalidFileMessage='invalid message' />);
		expect(screen.getByText(validMessage.msg)).toBeInTheDocument();
		expect(screen.getByText('invalid message')).toBeInTheDocument();
	});

	it('should render valid system message', () => {
		render(<MessageList messages={[{ ...validSystemMessage, files: [] }]} invalidFileMessage='' />);
		expect(screen.getByText(validSystemMessage.t)).toBeInTheDocument();
	});
});
