import type { TamaguiElement, ViewProps } from '@tamagui/web';
import type { Ref } from 'react';

type FrameProps<TProps> = {
	[Key in keyof TProps]: Key extends 'ref' ? Ref<TamaguiElement> : Key extends keyof ViewProps ? ViewProps[Key] : TProps[Key];
};

/**
 * A part's props as its frame types them, to forward one by one. Tamagui types a frame's handlers, `ref`, `role` and
 * ARIA attributes as a `div`'s, with React Native's pointer, touch, role and boolean ARIA types, whatever element its
 * `render` names; the values reach that element unchanged.
 */
export const frameProps = <TProps extends object>(props: TProps) => props as unknown as FrameProps<TProps>;
