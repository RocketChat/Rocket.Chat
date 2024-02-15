import { SurfaceOptions } from '../Preview/Display/Surface/constant';

type SelectOption = [value: string, label: string, selected?: boolean];

const options: SelectOption[] = [
  [`${SurfaceOptions.Message}`, 'Message Preview'],
  [`${SurfaceOptions.Banner}`, 'Banner Preview'],
  [`${SurfaceOptions.Modal}`, 'Modal Preview'],
  [`${SurfaceOptions.ContextualBar}`, 'Contextual Bar Preview'],
];

export default options;
