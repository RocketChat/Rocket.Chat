import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import PersonalAccessTokensView from './PersonalAccessTokensView';
import type { PersonalAccessTokensViewModel } from '../logic/usePersonalAccessTokens';

const createViewModel = (overrides: Partial<PersonalAccessTokensViewModel> = {}): PersonalAccessTokensViewModel => ({
	status: 'ready',
	tokens: [],
	userId: 'john.doe',
	dialog: null,
	create: async () => true,
	requestRegenerate: () => undefined,
	requestRemove: () => undefined,
	confirmDialog: async () => undefined,
	dismissDialog: () => undefined,
	retry: () => undefined,
	...overrides,
});

const tokens: PersonalAccessTokensViewModel['tokens'] = [
	{ name: 'ci-pipeline', createdAt: '2026-01-10T12:00:00.000Z', lastTokenPart: 'a1b2c3', bypassTwoFactor: false },
	{ name: 'backup-script', createdAt: '2026-03-02T08:30:00.000Z', lastTokenPart: 'd4e5f6', bypassTwoFactor: true },
];

const meta = {
	component: PersonalAccessTokensView,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				'API_Personal_Access_Token_Name': 'Personal access token name',
				'Created_at': 'Created at',
				'Last_token_part': 'Last token part',
				'Two Factor Authentication': 'Two factor authentication',
				'Refresh': 'Refresh',
				'Remove': 'Remove',
				'Ignore': 'Ignore',
				'Require': 'Require',
				'Add': 'Add',
				'API_Add_Personal_Access_Token': 'Add new personal access token',
				'Require_Two_Factor_Authentication': 'Require two-factor authentication',
				'Ignore_Two_Factor_Authentication': 'Ignore two-factor authentication',
				'API_Personal_Access_Token_Generated': 'Personal access token successfully generated',
				'API_Personal_Access_Token_Generated_Text_Token_s_UserId_s':
					'Please save your token carefully as you will no longer be able to view it afterwards. <br/>Token: <strong>{{token}}</strong><br/>Your user id: <strong>{{userId}}</strong>',
				'API_Personal_Access_Tokens_Regenerate_It': 'Regenerate token',
				'API_Personal_Access_Tokens_Regenerate_Modal':
					'If you lost or forgot your token, you can regenerate it, but remember that all applications that use this token should be updated',
				'API_Personal_Access_Tokens_Remove_Modal': 'Are you sure you wish to remove this personal access token?',
				'Something_went_wrong': 'Something went wrong',
				'We_Could_not_retrive_any_data': "We couldn't retrive any data",
				'Retry': 'Retry',
				'No_results_found': 'No results found',
				'Ok': 'Ok',
				'Cancel': 'Cancel',
			})
			.buildStoryDecorator(),
		(Story) => <Story />,
	],
} satisfies Meta<typeof PersonalAccessTokensView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {
	args: { vm: createViewModel({ status: 'loading' }) },
};

export const LoadError: Story = {
	args: { vm: createViewModel({ status: 'error', errorMessage: 'Network request failed' }) },
};

export const Empty: Story = {
	args: { vm: createViewModel() },
};

export const WithTokens: Story = {
	args: { vm: createViewModel({ tokens }) },
};

export const ConfirmRegenerate: Story = {
	args: { vm: createViewModel({ tokens, dialog: { type: 'confirm-regenerate', tokenName: 'ci-pipeline' } }) },
};

export const ConfirmRemove: Story = {
	args: { vm: createViewModel({ tokens, dialog: { type: 'confirm-remove', tokenName: 'ci-pipeline' } }) },
};

export const TokenGenerated: Story = {
	args: { vm: createViewModel({ tokens, dialog: { type: 'token-generated', token: 'Xk3v9Qm2Lp7RtY8wZ1' } }) },
};
