import { render } from '@testing-library/react';

import { Box } from '../Box';
import { Margins } from '../Margins';
import { Tag } from '../Tag';

describe('Tamagui-based components', () => {
	it('run the cleanup a callback ref returns, instead of calling it with null', () => {
		const calls: unknown[] = [];
		const cleanup = jest.fn();
		const ref = (node: unknown) => {
			calls.push(node);
			return cleanup;
		};

		const { unmount } = render(<Tag ref={ref}>tag</Tag>);
		unmount();

		expect(calls).toHaveLength(1);
		expect(calls[0]).toBeInstanceOf(HTMLElement);
		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it('take the margins of a Margins ancestor, as the Box they replaced did', () => {
		const Wrapper = ({ children }: { children: string }) => <Tag>{children}</Tag>;
		const { container } = render(
			<Margins inline={2}>
				<Wrapper>tag</Wrapper>
			</Margins>,
		);

		const marginClassName = container.querySelector('.rcx-tag')?.className.match(/rcx-css-[a-z0-9]+/)?.[0];
		const rules = [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules].map((rule) => rule.cssText));
		expect(rules.find((rule) => rule.includes(`.${marginClassName}`))).toMatch(/margin-left: 2px/);
	});

	it('keep the margins of a Margins ancestor off the Box elements inside them', () => {
		const { container } = render(
			<Margins inline={2}>
				<Tag>
					<Box className='inner'>tag</Box>
				</Tag>
			</Margins>,
		);

		expect(container.querySelector('.inner')?.className).not.toMatch(/rcx-css-/);
	});
});
