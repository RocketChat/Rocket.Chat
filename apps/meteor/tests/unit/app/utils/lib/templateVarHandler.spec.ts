import { expect } from 'chai';
import proxyquire from 'proxyquire';

const { templateVarHandler } = proxyquire.noCallThru().load('../../../../../app/utils/lib/templateVarHandler', {
  'meteor/meteor': {
    logger: {
      debug: () => {},
    },
    '@global': true,
  },
});

const testCases = (description: string, input: { variable: string; object: Record<string, any> }, expectedOutput: string | undefined) => {
  describe(description, () => {
    it('should process the variable correctly', () => {
      const result = templateVarHandler(input.variable, input.object);
      expect(result).to.be.equal(expectedOutput);
    });
  });
};

describe('templateVarHandler', () => {
  testCases(
    'Should return the value of a simple variable present in the object',
    { variable: 'attribute1', object: { attribute1: 'value1' } },
    'value1'
  );

  testCases(
    'Should return undefined for a simple variable not present in the object',
    { variable: 'attribute2', object: { attribute1: 'value1' } },
    undefined
  );

  testCases(
    'Should replace a template variable with the corresponding object value',
    { variable: '#{attribute1}', object: { attribute1: 'value1' } },
    'value1'
  );

  testCases(
    'Should return undefined for a template variable not present in the object',
    { variable: '#{attribute2}', object: { attribute1: 'value1' } },
    undefined
  );

  testCases(
    'Should replace multiple template variables with the corresponding object values',
    { variable: '#{attribute1} #{attribute2}', object: { attribute1: 'value1', attribute2: 'value2' } },
    'value1 value2'
  );

  testCases(
    'Should return undefined if any template variable is not present in the object',
    { variable: '#{attribute1} #{attribute3}', object: { attribute1: 'value1', attribute2: 'value2' } },
    undefined
  );

  testCases(
    'Should return undefined for a simple variable with no matching attribute in the object',
    { variable: 'attribute3', object: { attribute1: 'value1', attribute2: 'value2' } },
    undefined
  );

  testCases(
    'Should return undefined for an empty variable',
    { variable: '', object: { attribute1: 'value1', attribute2: 'value2' } },
    undefined
  );
});
