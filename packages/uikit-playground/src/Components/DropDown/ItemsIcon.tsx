import { Icon } from '@rocket.chat/fuselage';

const ItemsIcon = ({
  layer,
  lastNode,
  hover,
}: {
  layer: number;
  lastNode: boolean;
  hover: boolean;
}) => {
  const selectIcon = (layer: number, hover: boolean) => {
    if (layer === 1) {
      return (
        <Icon name='folder' size='x12' color={hover ? '#fff' : '#1d74f5'} />
      );
    }
    if (lastNode) {
      return <Icon name='cube' size='x12' color={hover ? '#fff' : '#f5455c'} />;
    }
    return (
      <Icon name='burger-menu' size='x12' color={hover ? '#fff' : '#19ac7c'} />
    );
  };
  return <>{selectIcon(layer, hover)}</>;
};

export default ItemsIcon;
