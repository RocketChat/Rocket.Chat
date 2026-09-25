import type { IAbacMembershipPreview } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';

import AbacMembershipPreview from './AbacMembershipPreview';

const appRoot = mockAppRoot().build();

const alice = { _id: 'alice', username: 'alice', name: 'Alice' };
const bob = { _id: 'bob', username: 'bob', name: 'Bob' };
const carol = { _id: 'carol', username: 'carol', name: 'Carol' };

const preview = (over: Partial<IAbacMembershipPreview> = {}): IAbacMembershipPreview => ({
	compliant: [alice],
	nonCompliant: [],
	inconclusive: [],
	creator: 'compliant',
	...over,
});

const renderPreview = (data?: IAbacMembershipPreview, props: { isPending?: boolean; isError?: boolean } = {}) =>
	render(<AbacMembershipPreview data={data} {...props} />, { wrapper: appRoot });

describe('AbacMembershipPreview', () => {
	it('should list every member in their group with the group count', () => {
		renderPreview(preview({ compliant: [alice, bob], nonCompliant: [carol] }));

		const compliant = screen.getByRole('region', { name: 'ABAC_Preview_Compliant' });
		expect(within(compliant).getByText('2')).toBeInTheDocument();
		expect(within(compliant).getAllByRole('listitem')).toHaveLength(2);
		expect(within(screen.getByRole('region', { name: 'ABAC_Preview_Non_Compliant' })).getByText('Carol')).toBeInTheDocument();
	});

	it('should show no callout when everyone is compliant', () => {
		renderPreview(preview());

		expect(screen.queryByText(/^ABAC_Preview_(Only|No|Creator|Inconclusive_Warning)/)).not.toBeInTheDocument();
	});

	it('should say only compliant members are added when some are not', () => {
		renderPreview(preview({ nonCompliant: [bob] }));

		expect(screen.getByText('ABAC_Preview_Only_Compliant_Added')).toBeInTheDocument();
	});

	it('should refuse a room with no compliant members', () => {
		renderPreview(preview({ compliant: [], nonCompliant: [alice], creator: 'nonCompliant' }));

		expect(screen.getByText('ABAC_Preview_No_Compliant_Members')).toBeInTheDocument();
		expect(screen.queryByText('ABAC_Preview_Creator_Not_Added')).not.toBeInTheDocument();
	});

	it('should warn a creator who will not be added', () => {
		renderPreview(preview({ nonCompliant: [bob], creator: 'nonCompliant' }));

		expect(screen.getByText('ABAC_Preview_Creator_Not_Added')).toBeInTheDocument();
	});

	it('should show undetermined members in their own group, not as compliant', () => {
		renderPreview(preview({ inconclusive: [bob] }));

		expect(within(screen.getByRole('region', { name: 'ABAC_Preview_Inconclusive' })).getByText('Bob')).toBeInTheDocument();
		expect(within(screen.getByRole('region', { name: 'ABAC_Preview_Compliant' })).queryByText('Bob')).not.toBeInTheDocument();
		expect(screen.getByText('ABAC_Preview_Inconclusive_Warning')).toBeInTheDocument();
		expect(screen.getByText('ABAC_Preview_Only_Compliant_Added')).toBeInTheDocument();
	});

	it('should say the preview is unavailable when it failed, never that members are compliant', () => {
		renderPreview(undefined, { isError: true });

		expect(screen.getByText('ABAC_Preview_Unavailable')).toBeInTheDocument();
		expect(screen.queryByRole('region')).not.toBeInTheDocument();
	});

	it('should have no accessibility violations', async () => {
		const { container } = renderPreview(preview({ nonCompliant: [bob], inconclusive: [carol] }));

		expect(await axe(container)).toHaveNoViolations();
	});
});
