import { FuselageHost } from './FuselageHost';
import { SweepList } from './SweepList';

export function Sweep({ onBack }: { onBack: () => void }) {
	return (
		<FuselageHost title='component sweep' onBack={onBack}>
			<SweepList />
		</FuselageHost>
	);
}
