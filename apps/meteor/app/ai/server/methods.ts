import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { generateAIResponse } from './aiService';
import { settings } from '../../../settings/server';

Meteor.methods({
  async 'ai.generate'(prompt: string) {
    // 🔒 Auth check
    if (!this.userId) {
      throw new Meteor.Error('error-not-authorized');
    }

    // 🔒 Feature toggle
    if (!settings.get('AI_Enable')) {
      throw new Meteor.Error('error-disabled', 'AI is disabled');
    }

    // 🔒 Input validation
    check(prompt, String);

    if (prompt.length > 2000) {
      throw new Meteor.Error('error-too-long', 'Prompt too long');
    }

    return await generateAIResponse(prompt);
  },
});