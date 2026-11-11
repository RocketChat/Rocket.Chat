import type { IUploadWithUser } from '@rocket.chat/core-typings';
import type { HTMLAttributes, Ref } from 'react';
import { forwardRef } from 'react';

export type RoomFileItemWrapperProps = HTMLAttributes<HTMLDivElement> & { item: IUploadWithUser };

const RoomFileItemWrapper = forwardRef(function RoomFileItemWrapper(
	{ item, ...props }: RoomFileItemWrapperProps,
	ref: Ref<HTMLDivElement>,
) {
	return <div ref={ref} role='listitem' aria-label={item.name} {...props} />;
});

export default RoomFileItemWrapper;
