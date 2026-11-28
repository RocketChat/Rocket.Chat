import type { IUploadWithUser } from '@rocket.chat/core-typings';

import type { ListRowProps } from '../../../../components/ListRow';
import ListRow from '../../../../components/ListRow';

export type RoomFileItemWrapperProps = Omit<ListRowProps, 'aria-label'> & { item: IUploadWithUser };

const RoomFileItemWrapper = ({ item, ...props }: RoomFileItemWrapperProps) => <ListRow aria-label={item.name} {...props} />;

export default RoomFileItemWrapper;
