import { settings } from '../../../settings/server';

// ✅ Enable/Disable AI
settings.add('AI_Enable', true, {
  type: 'boolean',
  public: true,
  group: 'AI',
});

// 🔐 OpenAI API Key (secure)
settings.add('AI_OpenAI_Key', '', {
  type: 'password',
  public: false,
  group: 'AI',
});