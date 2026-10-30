import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type ModalFormProps = Omit<ComponentProps<typeof Box>, 'is'>;

/** The form a modal submits from its footer, for `GenericModal`'s `wrapperFunction`. */
const ModalForm = (props: ModalFormProps) => <Box is='form' {...props} />;

export default ModalForm;
