import { Inject } from 'meteor/meteorhacks:inject-initial';

Inject.rawBody('custom-icons', Assets.getText('client/public/icons.svg'));
