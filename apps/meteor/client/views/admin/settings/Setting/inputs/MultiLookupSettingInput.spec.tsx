import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MultiLookupSettingInput from './MultiLookupSettingInput';

const LOOKUP_ENDPOINT = '/v1/ai.llm.models' as const;

type Options = { key: string; label: string }[];

const renderLoaded = async ({ value, options }: { value?: string[]; options: Options }) => {
	const onChangeValue = jest.fn();
	const lookup = jest.fn().mockResolvedValue({ data: options });

	render(
		<MultiLookupSettingInput
			_id='Setting_Id'
			label='Label'
			packageValue={[]}
			value={value}
			disabled={false}
			hasResetButton={false}
			lookupEndpoint={LOOKUP_ENDPOINT}
			onChangeValue={onChangeValue}
		/>,
		{ wrapper: mockAppRoot().withJohnDoe().withEndpoint('GET', LOOKUP_ENDPOINT, lookup).build() },
	);

	await waitFor(() => expect(lookup).toHaveBeenCalled());

	return { onChangeValue };
};

it('offers the options the endpoint returns', async () => {
	await renderLoaded({ options: [{ key: 'clearance', label: 'clearance' }] });

	await userEvent.click(screen.getByLabelText('Label'));

	expect(await screen.findByRole('option', { name: 'clearance' })).toBeInTheDocument();
});

it('keeps a stored value whose option no longer exists visible and removable', async () => {
	const { onChangeValue } = await renderLoaded({
		value: ['deleted_key'],
		options: [{ key: 'clearance', label: 'clearance' }],
	});

	expect(await screen.findByText('deleted_key')).toBeInTheDocument();

	await userEvent.click(screen.getByLabelText('Label'));
	await userEvent.click(await screen.findByRole('option', { name: 'deleted_key' }));

	expect(onChangeValue).toHaveBeenCalledWith([]);
});

it('does not list a stored value twice when the endpoint still returns it', async () => {
	await renderLoaded({
		value: ['clearance'],
		options: [{ key: 'clearance', label: 'clearance' }],
	});

	await userEvent.click(screen.getByLabelText('Label'));

	expect(await screen.findAllByRole('option', { name: 'clearance' })).toHaveLength(1);
});
