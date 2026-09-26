import { Module } from '@nestjs/common';
import { BrokerModule } from './broker/broker.module.js';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health/health.controller.js';
import { MessagesModule } from './messages/messages.module.js';
import { RoomsModule } from './rooms/rooms.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    BrokerModule,
    SettingsModule,
    MessagesModule,
    RoomsModule,
    SubscriptionsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
