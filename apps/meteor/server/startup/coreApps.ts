import { BannerModule } from '../modules/core-apps/banner.module';
import { CloudAnnouncementsModule } from '../modules/core-apps/cloudAnnouncements.module';
import { Nps } from '../modules/core-apps/nps.module';
import { VideoConfModule } from '../modules/core-apps/videoconf.module';
import { registerCoreApp } from '../services/uikit-core-app/service';

registerCoreApp(new CloudAnnouncementsModule());
registerCoreApp(new Nps());
registerCoreApp(new BannerModule());
registerCoreApp(new VideoConfModule());
