import { createStreamAdapter } from '@rocket.chat/ddp-server';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { NotificationsModule } from '@rocket.chat/streamer';

import { ddpServer } from '../../../realtime/ddpServer';

const notifications = new NotificationsModule(createStreamAdapter(ddpServer), InstanceStatus.id());

notifications.configure();

export default notifications;
