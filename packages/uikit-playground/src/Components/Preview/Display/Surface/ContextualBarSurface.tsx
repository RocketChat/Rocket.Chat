import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Contextualbar,
  ContextualbarAction,
  ContextualbarFooter,
  ContextualbarHeader,
  ContextualbarTitle,
  Margins,
} from '@rocket.chat/fuselage';
import { Scrollbars } from 'rc-scrollbars';
import { ReactNode } from 'react';

const ContextualBarSurface = ({ children }: { children: ReactNode }) => (
  <Contextualbar>
    <ContextualbarHeader>
      <Avatar url="data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==" />
      <ContextualbarTitle>{'Contextual Bar'}</ContextualbarTitle>
      <ContextualbarAction
        data-qa="ContextualbarActionClose"
        title="Close"
        name="cross"
      />
    </ContextualbarHeader>

    <Box height="100%" p="12px">
      <Box
        height="100%"
        display="flex"
        flexShrink={1}
        flexDirection="column"
        flexGrow={1}
        overflow="hidden"
      >
        <Scrollbars
          autoHide
          autoHideTimeout={2000}
          autoHideDuration={500}
          style={{
            width: '100%',
            height: '100%',
            flexGrow: 1,
            willChange: 'transform',
            overflowY: 'hidden',
          }}
          renderThumbVertical={({ style, ...props }): JSX.Element => (
            <div
              {...props}
              style={{
                ...style,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '7px',
              }}
            />
          )}
        >
          <Margins blockEnd="x16">{children}</Margins>
        </Scrollbars>
      </Box>
    </Box>

    <ContextualbarFooter>
      <ButtonGroup stretch>
        <Button>Cancel</Button>
        <Button primary>Submit</Button>
      </ButtonGroup>
    </ContextualbarFooter>
  </Contextualbar>
);

export default ContextualBarSurface;
