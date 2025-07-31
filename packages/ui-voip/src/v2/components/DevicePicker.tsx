import { ActionButton } from '.';

// type DevicePickerProps = {};

// TODO: Implement
const DevicePicker = ({ secondary = false }: { secondary?: boolean }) => {
	return <ActionButton label='customize' icon='customize' secondary={secondary} flexGrow={0} />;
};

export default DevicePicker;
