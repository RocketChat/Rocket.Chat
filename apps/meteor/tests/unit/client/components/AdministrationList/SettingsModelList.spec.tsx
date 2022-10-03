import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, spy } from 'chai';
import React from 'react';

import SettingsModelList from '../../../../../client/components/AdministrationList/SettingsModelList';
import RouterContextMock from '../../../../mocks/client/RouterContextMock';

describe('components/AdministrationList/SettingsModelList', () => {
	it('should render', async () => {
		render(<SettingsModelList closeList={() => null} />);

		expect(screen.getByText('Workspace_settings')).to.exist;
	});

	context('when clicked', () => {
		it('should go to admin settings', async () => {
			const pushRoute = spy();
			const closeList = spy();
			render(
				<RouterContextMock pushRoute={pushRoute}>
					<SettingsModelList closeList={closeList} />
				</RouterContextMock>,
			);
			const button = screen.getByText('Workspace_settings');

			userEvent.click(button);
			await waitFor(() => expect(pushRoute).to.have.been.called.with('admin-settings'));
			await waitFor(() => expect(closeList).to.have.been.called());
		});
	});
});
