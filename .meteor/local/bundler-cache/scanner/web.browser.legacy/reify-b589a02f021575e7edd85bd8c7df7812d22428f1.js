/**
 * @license React
 * use-subscription.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';var b=require("use-sync-external-store/shim");exports.useSubscription=function(a){return b.useSyncExternalStore(a.subscribe,a.getCurrentValue)};
