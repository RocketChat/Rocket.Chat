import { it } from 'node:test';

import { render, screen } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import AutoCompleteDepartmentAgent from './AutoCompleteDepartmentAgent';

it('should not display the placeholder when there is a value', () => {
	const { rerender } = render(
		<AutoCompleteDepartmentAgent value='' onChange={fn<FunctionLike>()} placeholder='Select an agent' agents={[]} />,
	);

	expect(screen.getByPlaceholderText('Select an agent')).toBeInTheDocument();

	rerender(<AutoCompleteDepartmentAgent value='agent1' onChange={fn<FunctionLike>()} placeholder='Select an agent' agents={[]} />);

	expect(screen.queryByPlaceholderText('Select an agent')).not.toBeInTheDocument();
});
