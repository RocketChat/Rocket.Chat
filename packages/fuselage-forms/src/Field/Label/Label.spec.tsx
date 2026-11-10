import { render } from '@testing-library/react';
import { createRef } from 'react';

import { HiddenLabel, LabelFor, ReferencedLabel } from '.';
import { Field } from '..';

it.each([
	['HiddenLabel', HiddenLabel],
	['LabelFor', LabelFor],
	['ReferencedLabel', ReferencedLabel],
])('%s should forward the caller ref to the rendered element', (_name, Label) => {
	const ref = createRef<HTMLElement>();

	const { getByText } = render(
		<Field>
			<Label ref={ref}>Test Field</Label>
		</Field>,
	);

	expect(ref.current).toBe(getByText('Test Field'));
});
