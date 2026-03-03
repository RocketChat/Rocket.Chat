import { BaseConnection } from './base-connection.ts';
import { DocumentProcessorsMixin } from './document-processors.ts';
import { MessageProcessorsMixin } from './message-processors.ts';
import { StreamHandlersMixin } from './connection-stream-handlers.ts';

// Because of the generic constraints, this will error if composed in the wrong order!
export const Connection = StreamHandlersMixin(
  MessageProcessorsMixin(
    DocumentProcessorsMixin(BaseConnection)
  )
);

export type Connection = InstanceType<typeof Connection>;

// Re-export standard configuration
export type { ConnectionOptions, OutstandingMethodBlock } from './base-connection.ts';