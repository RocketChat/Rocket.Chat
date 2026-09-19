import { settings } from '../../../settings/server';

settings.add('AI_Enable', true, {
  type: 'boolean',
  public: true,
  group: 'AI',
});

settings.add('AI_OpenAI_Key', '', {
  type: 'password',
  public: false,
  group: 'AI',
});