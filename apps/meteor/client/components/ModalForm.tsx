import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FormEventHandler } from 'react';

export type ModalFormProps = Pick<ComponentProps<typeof Box>, 'elevation' | 'className' | 'children'> & {
	onSubmit: FormEventHandler<HTMLElement>;
};

/**
 * Turns a modal's surface into the form its fields and confirm button submit, for `GenericModal`'s `wrapperFunction`.
 */
const ModalForm = (props: ModalFormProps) => <Box is='form' {...props} />;

export default ModalForm;
