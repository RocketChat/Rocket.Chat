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
import React from 'react';

const ModalSurface = ({ children }: { children: ReactNode }) => (
  <Modal>
    <ModalHeader>
      <ModalThumb url="data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==" />
      <ModalTitle>Modal Header</ModalTitle>
      <ModalClose />
    </ModalHeader>
    <ModalContent>{children}</ModalContent>
    <ModalFooter>
      <ButtonGroup align="end">
        <Button>Cancel</Button>
        <Button primary>Submit</Button>
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export default ModalSurface;
