import { Box } from '@rocket.chat/fuselage';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import type { BlazeTemplates } from 'meteor/templating';
import { Template } from 'meteor/templating';
import type { ComponentProps } from 'react';
import React, { memo, useLayoutEffect, useRef } from 'react';

import { useBlazePortals } from '../../../lib/portals/blazePortals';
import { useRoom } from '../contexts/RoomContext';
import { useRoomMessageContext } from './body/useRoomMessageContext';

type PropsFromBox = 'className' | 'display' | 'flexGrow' | 'flexShrink' | 'flexDirection' | 'overflow' | 'w' | 'onClick' | 'onMouseEnter';

type AllBlazeTemplateProps = {
	[TTemplateName in keyof BlazeTemplates]: BlazeTemplates[TTemplateName] extends Blaze.Template<infer D, any>
		? symbol extends D
			? {
					name: TTemplateName;
			  } & Pick<ComponentProps<typeof Box>, PropsFromBox>
			: {
					name: TTemplateName;
			  } & Pick<ComponentProps<typeof Box>, Exclude<PropsFromBox, keyof D>> &
					D
		: never;
};

type BlazeTemplateProps<TTemplateName extends keyof AllBlazeTemplateProps> = TTemplateName extends any
	? AllBlazeTemplateProps[TTemplateName]
	: never;

const BlazeTemplate = <TTemplateName extends keyof AllBlazeTemplateProps>({
	name,
	className,
	display,
	flexGrow,
	flexShrink,
	flexDirection,
	overflow,
	w,
	onClick,
	onMouseEnter,
	...props
}: BlazeTemplateProps<TTemplateName>) => {
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
				className={className}
				display={display ?? 'flex'}
				flexGrow={flexGrow ?? 1}
				flexShrink={flexShrink}
				flexDirection={flexDirection ?? 'column'}
				ref={ref}
				w={w}
				overflow={overflow}
				onClick={onClick}
				onMouseEnter={onMouseEnter}
			/>
			{portals}
		</>
	);
};

export default memo(BlazeTemplate);
