import { settings } from '../../../settings/server';

// Enable/Disable AI
settings.add('AI_OpenAI_Key', '', {
  type: 'password', 
  public: false,
  group: 'AI',
});

settings.add('AI_OpenAI_Key', '', {
  type: 'string',
  public: false,
  group: 'AI',
});