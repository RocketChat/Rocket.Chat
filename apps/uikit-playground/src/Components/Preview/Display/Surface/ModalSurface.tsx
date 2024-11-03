import { css } from '@rocket.chat/css-in-js';
import {
  Modal,
  ModalHeader,
  ModalThumb,
  ModalTitle,
  ModalClose,
  ModalContent,
  ModalFooter,
  ButtonGroup,
  Button,
} from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const ModalSurface = ({ children }: { children: ReactNode }) => (
  <Modal>
    <ModalHeader>
      <ModalThumb url="data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==" />
      <ModalTitle>Modal Header</ModalTitle>
      <ModalClose />
    </ModalHeader>
    <ModalContent
      className={css`
        overflow: visible;
      `}
    >
      {children}
    </ModalContent>
    <ModalFooter>
      <ButtonGroup align="end">
        <Button>Cancel</Button>
        <Button primary>Submit</Button>
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export default ModalSurface;
