import './conversation';
import './direct';
import './favorite';
import './livechat';
import './private';
import './public';
import './unread';
import { registerRoomTypeRoutes } from '../registerRoomTypeRoutes';

// Room types are registered above via import side effects; now that they all exist, wire up their
// routes. Route registration is deliberately kept out of the coordinator to avoid a view-layer
// import cycle (see registerRoomTypeRoutes).
registerRoomTypeRoutes();
