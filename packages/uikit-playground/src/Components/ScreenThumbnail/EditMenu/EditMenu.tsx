import { Box, Icon, Button, Divider, Option } from '@rocket.chat/fuselage';
import EditableLabel from '../EditableLabel/EditableLabel';
import { ComponentProps, useRef, useState } from 'react';
import { ChangeEvent } from 'react';
import { useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { formatDate } from '../../../utils/formatDate';

const EditMenu = ({
  name,
  date,
  onChange,
  onBlur,
  onDuplicate,
  onDelete,
  labelProps,
}: {
  name: string;
  date: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onBlur: () => void;
  labelProps?: ComponentProps<typeof EditableLabel>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick([containerRef], () => {
    setIsOpen(false);
    onBlur();
  });

  const duplicatehandler = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setIsOpen(false);
    onDuplicate && onDuplicate();
  };

  const deleteHandler = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setIsOpen(false);
    onDelete && onDelete();
  };
  return (
    <Box
      position="absolute"
      insetBlockStart="10px"
      insetInlineEnd="10px"
      zIndex={100}
      ref={containerRef}
      className="rc-edit-menu"
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(true);
      }}
    >
      <Button ref={buttonRef} square mini>
        <Icon name="cog" size="x16" />
      </Button>
      {isOpen && (
        <Box position="absolute">
          <Box elevation="1" pb="10px" bg="white">
            <Box mi="10px">
              <EditableLabel
                value={name}
                onChange={onChange}
                onBlur={onBlur}
                {...labelProps}
              />
              <Box withTruncatedText mbs="2px" fontScale="p2">
                {formatDate(date)}
              </Box>
            </Box>
            <Divider mbs="12px" />
            <Option disabled={!onDuplicate} onClick={duplicatehandler}>
              Duplicate
            </Option>
            <Option disabled={!onDelete} onClick={deleteHandler}>
              Delete
            </Option>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default EditMenu;
