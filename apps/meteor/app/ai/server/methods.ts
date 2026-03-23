import { Meteor } from 'meteor/meteor';
import { generateAIResponse } from './aiService';

Meteor.methods({
  async 'ai.generate'(prompt: string) {
    if (!this.userId) {
      throw new Meteor.Error('Not authorized');
    }

    return await generateAIResponse(prompt);
  },
});