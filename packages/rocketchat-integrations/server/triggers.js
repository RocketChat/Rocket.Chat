RocketChat.callbacks.add('afterSaveMessage', RocketChat.integrations.triggerHandler.executeTriggers, RocketChat.callbacks.priority.LOW, 'ExecuteTriggers');
