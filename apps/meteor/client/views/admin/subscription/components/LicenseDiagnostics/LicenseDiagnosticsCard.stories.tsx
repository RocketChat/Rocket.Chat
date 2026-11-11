import type { Meta, StoryObj } from '@storybook/react';

import LicenseDiagnosticsCard from './LicenseDiagnosticsCard';
import { licenseDiagnosticsByState } from './licenseDiagnosticsFixtures';

export default {
	component: LicenseDiagnosticsCard,
	parameters: {
		layout: 'padded',
	},
} satisfies Meta<typeof LicenseDiagnosticsCard>;

type Story = StoryObj<typeof LicenseDiagnosticsCard>;

export const NotReady: Story = { args: { diagnostics: licenseDiagnosticsByState.notReady } };
export const NoLicense: Story = { args: { diagnostics: licenseDiagnosticsByState.noLicense } };
export const NeedsReapply: Story = { args: { diagnostics: licenseDiagnosticsByState.needsReapply } };
export const Unreadable: Story = { args: { diagnostics: licenseDiagnosticsByState.unreadable } };
export const SeveralAddresses: Story = { args: { diagnostics: licenseDiagnosticsByState.severalAddresses } };
export const UrlMismatch: Story = { args: { diagnostics: licenseDiagnosticsByState.urlMismatch } };
export const OutsidePeriod: Story = { args: { diagnostics: licenseDiagnosticsByState.outsidePeriod } };
export const OverLimits: Story = { args: { diagnostics: licenseDiagnosticsByState.overLimits } };
export const Invalid: Story = { args: { diagnostics: licenseDiagnosticsByState.invalid } };
export const EnvLicenseWon: Story = { args: { diagnostics: licenseDiagnosticsByState.envLicenseWon } };
export const OverwriteVariable: Story = { args: { diagnostics: licenseDiagnosticsByState.overwriteVariable } };
export const ModulesDisabled: Story = {
	args: { diagnostics: licenseDiagnosticsByState.modulesDisabled, activeModules: ['auditing', 'custom-roles'] },
};
export const Offline: Story = { args: { diagnostics: licenseDiagnosticsByState.offline } };
export const Valid: Story = { args: { diagnostics: licenseDiagnosticsByState.valid } };
