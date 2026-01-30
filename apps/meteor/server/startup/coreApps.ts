import { BannerModule } from '../modules/core-apps/banner.module';
import { CloudAnnouncementsModule } from '../modules/core-apps/cloudAnnouncements.module';
import { CloudSubscriptionCommunication } from '../modules/core-apps/cloudSubscriptionCommunication.module';
import { MentionModule } from '../modules/core-apps/mention.module';
import { Nps } from '../modules/core-apps/nps.module';
import { VideoConfModule } from '../modules/core-apps/videoconf.module';
import { registerCoreApp } from '../services/uikit-core-app/service';

registerCoreApp(new CloudAnnouncementsModule());
registerCoreApp(new CloudSubscriptionCommunication());
registerCoreApp(new Nps());
registerCoreApp(new BannerModule());
registerCoreApp(new VideoConfModule());
registerCoreApp(new MentionModule());
