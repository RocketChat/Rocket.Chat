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

	it('should render the raw message when its markup has content the PDF cannot draw', () => {
		const msg = '- [ ] unsupported task';
		render(
			<MessageList
				messages={[
					{
						...validMessage,
						msg,
						md: [
							{
								type: 'TASKS',
								value: [{ type: 'TASK', status: false, value: [{ type: 'PLAIN_TEXT', value: 'unsupported task' }] }],
							},
						],
					},
				]}
				invalidFileMessage=''
			/>,
		);
		expect(screen.getByText(msg)).toBeInTheDocument();
	});

	it('should render items nested in a list', () => {
		render(
			<MessageList
				messages={[
					{
						...validMessage,
						md: [
							{
								type: 'UNORDERED_LIST',
								value: [
									{
										type: 'LIST_ITEM',
										value: [{ type: 'PLAIN_TEXT', value: 'parent item' }],
										nested: [
											{
												type: 'ORDERED_LIST',
												value: [{ type: 'LIST_ITEM', number: 1, value: [{ type: 'PLAIN_TEXT', value: 'nested item' }] }],
											},
										],
									},
								],
							},
						],
					},
				]}
				invalidFileMessage=''
			/>,
		);
		expect(screen.getByText('parent item')).toBeInTheDocument();
		expect(screen.getByText('nested item')).toBeInTheDocument();
	});

	it('should render valid system message', () => {
		render(<MessageList messages={[{ ...validSystemMessage, files: [] }]} invalidFileMessage='' />);
		expect(screen.getByText(validSystemMessage.t)).toBeInTheDocument();
	});
});
