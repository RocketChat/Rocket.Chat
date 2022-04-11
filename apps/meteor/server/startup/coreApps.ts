import { Nps } from '../modules/core-apps/nps.module';
import { BannerModule } from '../modules/core-apps/banner.module';
import { registerCoreApp } from '../services/uikit-core-app/service';

registerCoreApp(new Nps());
registerCoreApp(new BannerModule());
