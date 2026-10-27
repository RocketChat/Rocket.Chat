import { Icon } from '@rocket.chat/fuselage';

export type ItemsIconProps = { layer: number; lastNode: boolean };

const ItemsIcon = ({ layer, lastNode }: ItemsIconProps) => {
	if (layer === 1) {
		return <Icon name='folder' size='x12' />;
	}
	if (lastNode) {
		return <Icon name='cube' size='x12' />;
	}
	return <Icon name='burger' size='x12' />;
};

export default ItemsIcon;
