import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
  version: 141,
  up() {
    Settings.remove({ _id: 'Livechat_open_inquiery_show_connecting' });
  },
});
