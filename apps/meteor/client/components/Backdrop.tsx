import { ModalBackdrop } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type BackdropProps = ComponentProps<typeof ModalBackdrop>;

export const Backdrop = (props: BackdropProps) => <ModalBackdrop bg='transparent' {...props} />;
