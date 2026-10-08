import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';

import type { AbacAttributesFormData } from './AbacAttributesStep';
import AbacAttributesStep from './AbacAttributesStep';

const assignable = [
	{ key: 'clearance', values: ['secret'] },
	{ key: 'program', values: ['air-force'] },
	{ key: 'project', values: ['apollo'] },
];

const roomAttributes: IAbacAttributeDefinition[] = [
	{ key: 'clearance', values: ['secret'] },
	{ key: 'program', values: ['air-force'] },
];

const Step = ({ requiredKeys }: { requiredKeys: string[] }) => {
	const methods = useForm<AbacAttributesFormData>({ defaultValues: { attributes: roomAttributes } });

	return (
		<FormProvider {...methods}>
			<button onClick={() => methods.setValue('attributes.2.key', 'clearance', { shouldValidate: true })}>pick clearance in row 3</button>
			<AbacAttributesStep
				requiredKeys={requiredKeys}
				assignable={assignable}
				isPending={false}
				error={null}
				assignabilityError={undefined}
			/>
		</FormProvider>
	);
};

const renderStep = (requiredKeys: string[]) => {
	const view = render(<Step requiredKeys={requiredKeys} />, {
		wrapper: mockAppRoot().withTranslations('en', 'core', { Attribute: 'Attribute', Remove: 'Remove' }).build(),
	});

	return { rerenderWith: (keys: string[]) => view.rerender(<Step requiredKeys={keys} />) };
};

describe('AbacAttributesStep', () => {
	it('should add a row for a key that becomes required while the form is open', () => {
		const { rerenderWith } = renderStep(['clearance']);
		expect(screen.getAllByText('Attribute')).toHaveLength(2);

		rerenderWith(['clearance', 'project']);

		expect(screen.getAllByText('Attribute')).toHaveLength(3);
	});

	it('should let a row added after the required set grew be removed', async () => {
		const { rerenderWith } = renderStep(['clearance']);
		rerenderWith(['clearance', 'project']);
		const removableBefore = screen.queryAllByRole('button', { name: 'Remove' }).length;

		await userEvent.click(screen.getByRole('button', { name: 'ABAC_Add_Attribute' }));

		expect(screen.getAllByText('Attribute')).toHaveLength(4);
		expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(removableBefore + 1);
	});

	it('should keep an added row removable when it repeats a required key', async () => {
		renderStep(['clearance']);
		await userEvent.click(screen.getByRole('button', { name: 'ABAC_Add_Attribute' }));
		const removable = screen.getAllByRole('button', { name: 'Remove' }).length;

		await userEvent.click(screen.getByRole('button', { name: 'pick clearance in row 3' }));

		expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(removable);
	});

	it('should not add a row for a required key the form already has', () => {
		const { rerenderWith } = renderStep(['clearance']);

		rerenderWith(['clearance', 'program']);

		expect(screen.getAllByText('Attribute')).toHaveLength(2);
		expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
	});
});
