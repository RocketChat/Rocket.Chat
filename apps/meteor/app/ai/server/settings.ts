import { settings } from '../../../settings/server';

// Enable/Disable AI
settings.add('AI_Enable', true, {
  type: 'boolean',
  public: true,
  group: 'AI',
});


settings.add('AI_OpenAI_Key', '', {
  type: 'string',
  public: false,
  group: 'AI',
});