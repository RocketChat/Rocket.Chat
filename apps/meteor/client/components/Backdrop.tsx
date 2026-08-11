import type { ModalBackdropProps } from '@rocket.chat/fuselage';
import { ModalBackdrop } from '@rocket.chat/fuselage';

export type BackdropProps = ModalBackdropProps;

export const Backdrop = (props: BackdropProps) => <ModalBackdrop backgroundColor='transparent' {...props} />;
