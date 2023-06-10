type containerType = {
  type: string;
  text: string;
};
const container: containerType[] = [
  {
    type: 'message',
    text: 'The contents of the original message where the action originated',
  },
  {
    type: 'banner',
    text: '',
  },
  {
    type: 'modal',
    text: '',
  },
];
export default container;
