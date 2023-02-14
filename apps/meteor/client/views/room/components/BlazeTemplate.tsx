import { Box } from '@rocket.chat/fuselage';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import type { ComponentProps, FC } from 'react';
import React, { memo, useLayoutEffect, useRef } from 'react';

import { useBlazePortals } from '../../../lib/portals/blazePortals';
import { useRoom } from '../contexts/RoomContext';
import { useRoomMessageContext } from './body/useRoomMessageContext';

const BlazeTemplate: FC<
	Omit<ComponentProps<typeof Box>, 'children'> & {
		name: string;
	} & Record<string, unknown>
> = ({ name, flexShrink, overflow, onClick, w, ...props }) => {
	const [portals, portalsSubscription] = useBlazePortals();
	const roomMessageContext = useRoomMessageContext(useRoom());

	const reactiveDataContextRef = useRef(new ReactiveVar(props));

	useLayoutEffect(() => {
		reactiveDataContextRef.current.set({ ...roomMessageContext, ...props });
	});

	const ref = useRef<HTMLDivElement>();

	useLayoutEffect(() => {
		if (!ref.current) {
			return;
		}

		const view = Blaze.renderWithData(
			Template[name],
			() => ({ ...reactiveDataContextRef.current.get(), portalsSubscription: () => portalsSubscription }),
			ref.current,
		);

		return (): void => {
			Blaze.remove(view);
		};
	}, [name, portalsSubscription]);

	return (
		<>
			<Box
				rcx-blaze-template
				display='flex'
				flexDirection='column'
				flexGrow={1}
				ref={ref}
				onClick={onClick}
				{...{ w, flexShrink, overflow }}
			/>
			{portals}
		</>
	);
};

export default memo(BlazeTemplate);
