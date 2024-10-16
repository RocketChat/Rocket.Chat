import { SurfaceOptions } from '../../Components/Preview/Display/Surface/constant';

type containerType = {
  [key: number]: {
    type: string,
    text: string,
  },
};
const container: containerType = {
  [SurfaceOptions.Message]: {
    type: 'message',
    text: 'The contents of the original message where the action originated',
  },
  [SurfaceOptions.Banner]: {
    type: 'banner',
    text: '',
  },
  [SurfaceOptions.Modal]: {
    type: 'modal',
    text: '',
  },
  [SurfaceOptions.ContextualBar]: {
    type: 'ContextualBar',
    text: '',
  },
};
export default container;
