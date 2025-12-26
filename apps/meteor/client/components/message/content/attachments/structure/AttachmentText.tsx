import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';
import type { MessageAttachmentDefault } from '@rocket.chat/core-typings';

type AttachmentTextProps = ComponentPropsWithoutRef<typeof Box> & {
	attachment?: MessageAttachmentDefault;
	children?: React.ReactNode;
};

const AttachmentText = ({ attachment, children, ...props }: AttachmentTextProps) => (
    <Box
        data-qa-type='message-attachment'
        mbe={4}
        mi={2}
        fontScale='p2'
        color='default'
        style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
        }}
        {...props}
    >
        {children}

        {attachment?.footer && (
            <Box
                fontScale='c1'
                color='neutral-600'
                marginBlockStart='x4'
                style={{ opacity: 0.8 }}
            >
                {attachment.footer}
            </Box>
        )}
    </Box>
);

export default AttachmentText;
