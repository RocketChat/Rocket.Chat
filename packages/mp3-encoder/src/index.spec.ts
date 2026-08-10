import './index';

declare const self: any;

describe('web worker messages', () => {
  beforeEach(() => {
    self.onmessage = jest.fn(self.onmessage);
    self.postMessage = jest.fn();
  });

  it('handles init message', () => {
    const event = new MessageEvent('message', {
      data: {
        command: 'init',
      },
    });
    self.dispatchEvent(event);
    expect(self.onmessage).toHaveBeenCalledTimes(1);
  });

  it('handles encode message', () => {
    const event = new MessageEvent('message', {
      data: {
        command: 'encode',
        buffer: new ArrayBuffer(0),
      },
    });
    self.dispatchEvent(event);
    expect(self.onmessage).toHaveBeenCalledTimes(1);
  });

  it('handles finish message', () => {
    const event = new MessageEvent('message', {
      data: {
        command: 'finish',
      },
    });
    self.dispatchEvent(event);
    expect(self.onmessage).toHaveBeenCalledTimes(1);
    expect(self.postMessage).toHaveBeenCalledTimes(1);
  });
});
