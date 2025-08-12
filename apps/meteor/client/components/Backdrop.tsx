import { ModalBackdrop } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

type BackdropProps = ComponentProps<typeof ModalBackdrop>;

export const Backdrop = (props: BackdropProps) => <ModalBackdrop bg='transparent' {...props} />;
