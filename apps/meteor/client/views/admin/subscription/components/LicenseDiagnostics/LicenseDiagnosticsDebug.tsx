import { Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import type { SelectOption } from '@rocket.chat/fuselage';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import LicenseDiagnosticsCard from './LicenseDiagnosticsCard';
import { getDiagnosticsState } from './getDiagnosticsState';
import type { DiagnosticsStateName, LicenseDiagnosticsResult } from './getDiagnosticsState';
import { licenseDiagnosticsByState } from './licenseDiagnosticsFixtures';

const CURRENT = 'current';

type LicenseDiagnosticsDebugProps = {
	diagnostics?: LicenseDiagnosticsResult;
	activeModules?: string[];
};

const LicenseDiagnosticsDebug = ({ diagnostics, activeModules }: LicenseDiagnosticsDebugProps) => {
	const { t } = useTranslation();
	const id = useId();
	const [selected, setSelected] = useState<DiagnosticsStateName | typeof CURRENT>(CURRENT);

	const options: SelectOption[] = [
		...Object.entries(licenseDiagnosticsByState).map(([name, fixture]): SelectOption => [name, t(getDiagnosticsState(fixture).headline)]),
		[CURRENT, 'Current status'],
	];

	const shown = selected === CURRENT ? diagnostics : licenseDiagnosticsByState[selected];

	return (
		<>
			<Field>
				<FieldLabel htmlFor={id}>License status (debug)</FieldLabel>
				<FieldRow>
					<Select id={id} value={selected} options={options} onChange={setSelected} />
				</FieldRow>
			</Field>
			{shown && (
				<LicenseDiagnosticsCard key={selected} diagnostics={shown} activeModules={selected === CURRENT ? activeModules : undefined} />
			)}
		</>
	);
};

export default LicenseDiagnosticsDebug;
