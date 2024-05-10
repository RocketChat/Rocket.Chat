import { Modal } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

type BackdropProps = ComponentProps<typeof Modal.Backdrop>;

export const Backdrop = (props: BackdropProps): ReactElement => <Modal.Backdrop bg='transparent' {...props} />;
