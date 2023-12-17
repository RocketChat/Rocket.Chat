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

import DraggableList from '../../../Draggable/DraggableList';
import type { DraggableListProps } from '../../../Draggable/DraggableList';

const ModalSurface = ({ blocks, onDragEnd }: DraggableListProps) => (
  <Modal>
    <ModalHeader>
      <ModalThumb url='data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==' />
      <ModalTitle>Modal Header</ModalTitle>
      <ModalClose />
    </ModalHeader>
    <ModalContent>
      <DraggableList surface={3} blocks={blocks} onDragEnd={onDragEnd} />
    </ModalContent>
    <ModalFooter>
      <ButtonGroup align='end'>
        <Button>Cancel</Button>
        <Button primary>Submit</Button>
      </ButtonGroup>
    </ModalFooter>
  </Modal>
);

export default ModalSurface;
