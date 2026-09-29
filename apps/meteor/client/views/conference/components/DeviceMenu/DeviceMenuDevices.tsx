import { useTranslation } from 'react-i18next';

import DeviceMenuOption from './DeviceMenuOption';
import type { DeviceRow } from './deviceMenuRows';

export type DeviceMenuDevicesProps = {
	rows: DeviceRow[];
	selectedId: string | undefined;
	onSelect: (deviceId: string) => void;
};

/** The devices of one kind, as options. */
const DeviceMenuDevices = ({ rows, selectedId, onSelect }: DeviceMenuDevicesProps) => {
	const { t } = useTranslation();

	return (
		<>
			{rows.map((row) => (
				<DeviceMenuOption
					key={row.id}
					name={row.name}
					note={row.systemDefault ? `${t('System')} ${t('Default').toLowerCase()}` : undefined}
					selected={row.id === selectedId}
					onSelect={() => onSelect(row.id)}
				/>
			))}
		</>
	);
};

export default DeviceMenuDevices;
