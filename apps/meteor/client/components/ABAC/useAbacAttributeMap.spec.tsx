import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useController, useFieldArray, useForm, useFormContext } from 'react-hook-form';

import { useAbacAttributeMap } from './useAbacAttributeMap';

type Form = { attributes: { key: string; values: string[] }[] };

const Row = ({ index }: { index: number }) => {
	const { control } = useFormContext<Form>();
	const { field: key } = useController({ name: `attributes.${index}.key`, control });
	const { field: values } = useController({ name: `attributes.${index}.values`, control });

	return (
		<>
			<button type='button' onClick={() => key.onChange('clearance')}>
				{`set-key-${index}`}
			</button>
			<button type='button' onClick={() => values.onChange(['secret'])}>
				{`set-values-${index}`}
			</button>
		</>
	);
};

const Harness = ({ initial = [] }: { initial?: Form['attributes'] }) => {
	const methods = useForm<Form>({ defaultValues: { attributes: initial } });
	const { control } = methods;
	const { fields, append, remove } = useFieldArray({ control, name: 'attributes' });
	const attributeMap = useAbacAttributeMap(control);

	return (
		<FormProvider {...methods}>
			<button type='button' onClick={() => append({ key: '', values: [] })}>
				add
			</button>
			<button type='button' onClick={() => remove(0)}>
				remove-first
			</button>
			{fields.map((field, index) => (
				<Row key={field.id} index={index} />
			))}
			<output data-testid='map'>{JSON.stringify(attributeMap)}</output>
		</FormProvider>
	);
};

const map = () => JSON.parse(screen.getByTestId('map').textContent || '{}');

/**
 * ABAC-P4 QA — the regression this exists to prevent.
 *
 * react-hook-form mutates the field array in place, so an array taken from `watch()` keeps its
 * identity when a row changes. All three attribute-editing surfaces memoised on that identity and
 * so kept serving the value from first render: an empty set while creating a room, and the room's
 * original attributes while editing one. Downstream that meant a membership preview that never
 * loaded and PDP refusals that did not match what the user had selected.
 */
describe('useAbacAttributeMap', () => {
	it('reflects a value chosen after the row was added', async () => {
		render(<Harness />);

		await userEvent.click(screen.getByText('add'));
		await userEvent.click(screen.getByText('set-key-0'));
		await userEvent.click(screen.getByText('set-values-0'));

		expect(map()).toEqual({ clearance: ['secret'] });
	});

	it('starts empty when no row has been added', () => {
		render(<Harness />);

		expect(map()).toEqual({});
	});

	it('leaves out a row with a key but no values', async () => {
		render(<Harness />);

		await userEvent.click(screen.getByText('add'));
		await userEvent.click(screen.getByText('set-key-0'));

		expect(map()).toEqual({});
	});

	it('leaves out a row with values but no key', async () => {
		render(<Harness />);

		await userEvent.click(screen.getByText('add'));
		await userEvent.click(screen.getByText('set-values-0'));

		expect(map()).toEqual({});
	});

	it('starts from the rows the form was seeded with', () => {
		render(<Harness initial={[{ key: 'mission', values: ['alpha'] }]} />);

		expect(map()).toEqual({ mission: ['alpha'] });
	});

	it('follows an edit to a seeded row rather than reporting its original values', async () => {
		render(<Harness initial={[{ key: 'clearance', values: ['topsecret'] }]} />);

		await userEvent.click(screen.getByText('set-values-0'));

		expect(map()).toEqual({ clearance: ['secret'] });
	});

	it('drops a row that is removed', async () => {
		render(<Harness initial={[{ key: 'mission', values: ['alpha'] }]} />);

		await userEvent.click(screen.getByText('remove-first'));

		expect(map()).toEqual({});
	});
});
