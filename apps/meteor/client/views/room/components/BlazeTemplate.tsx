import { Box } from '@rocket.chat/fuselage';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import React, { ComponentProps, FC, memo, useLayoutEffect, useRef } from 'react';

const BlazeTemplate: FC<
	Omit<ComponentProps<typeof Box>, 'children'> & {
		name: string;
	} & Record<string, unknown>
> = ({ name, flexShrink, overflow, onClick, ...props }) => {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const ref = useRef(null!);
	useLayoutEffect(() => {
		if (!ref.current || !Template[name]) {
			return;
		}

		const view = Blaze.renderWithData(Template[name], props, ref.current);
		return (): void => {
			view && Blaze.remove(view);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [name, JSON.stringify(props)]);
	return (
		<Box rcx-blaze-template display='flex' onClick={onClick} flexDirection='column' flexGrow={1} ref={ref} {...{ flexShrink, overflow }} />
	);
};

export default memo(BlazeTemplate);
