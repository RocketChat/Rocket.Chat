import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';

type EnhancementToolbarDropdownProps = {
  type: 'tone' | 'translate';
  options: Array<{ id: string; label: string }>;
  onSelect: (id: string) => void;
  disabled: boolean;
};

const EnhancementToolbarDropdown = ({ type, options, onSelect, disabled }: EnhancementToolbarDropdownProps) => {
  const { t } = useTranslation();
  const iconMap = { tone: 'keyboard', translate: 'language' } as const;
  const titleMap = { tone: 'Change Tone', translate: 'Translate' } as const;

  const items: GenericMenuItemProps[] = options.map((opt) => ({
    id: `${type}-${opt.id}`,
    content: t(opt.label),
    icon: iconMap[type],
    onClick: () => onSelect(opt.id)
  }));

  return (
    <GenericMenu
      detached
      disabled={disabled}
      icon={iconMap[type]}
      title={t(titleMap[type])}
      sections={[{ title: t(titleMap[type]), items }]}
    />
  );
};

export default EnhancementToolbarDropdown;
