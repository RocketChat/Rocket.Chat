import './Editablelabel.scss';
import { Box, Icon, Input } from '@rocket.chat/fuselage';
import { MouseEventHandler } from 'react';
import { ComponentProps, useRef, useState } from 'react';

const EditableLabel = (props: ComponentProps<typeof Input>) => {
  const [hover, setHover] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const iconClickHandler: MouseEventHandler<HTMLElement> = (e) => {
    e.stopPropagation();
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  return (
    <Box
      position="relative"
      className="rc-editableLabel"
      w="100%"
      h="max-content"
      display="flex"
      alignItems="center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Input ref={inputRef} {...props} />
      <Icon
        invisible={!hover}
        className={'editableLabel-icon'}
        name="pencil"
        onClick={iconClickHandler}
      />
    </Box>
  );
};

export default EditableLabel;
