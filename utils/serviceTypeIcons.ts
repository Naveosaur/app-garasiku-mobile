import { MaterialIcons } from '@expo/vector-icons';

export type ServiceIconName = React.ComponentProps<typeof MaterialIcons>['name'];

export interface ServiceIconOption {
  icon: ServiceIconName;
  label: string;
}

// Available icons for user to pick
export const SERVICE_ICON_OPTIONS: ServiceIconOption[] = [
  { icon: 'opacity',                label: 'Oil' },
  { icon: 'build',                  label: 'Wrench' },
  { icon: 'battery-charging-full',  label: 'Battery' },
  { icon: 'settings',               label: 'Gear' },
  { icon: 'construction',           label: 'Tools' },
  { icon: 'air',                    label: 'Air' },
  { icon: 'water-drop',             label: 'Fluid' },
  { icon: 'electric-bolt',          label: 'Electric' },
  { icon: 'tire-repair',            label: 'Tire' },
  { icon: 'cleaning-services',      label: 'Clean' },
  { icon: 'speed',                  label: 'Speed' },
  { icon: 'thermostat',             label: 'Temp' },
];

// Auto-detect icon from service type name OR use stored icon
export function getIconForServiceType(nameOrIcon: string): ServiceIconName {
  // If it's already a valid icon name (from backend), use it directly
  const isIconName = SERVICE_ICON_OPTIONS.some(o => o.icon === nameOrIcon);
  if (isIconName) return nameOrIcon as ServiceIconName;

  // Otherwise auto-detect from name
  const lower = nameOrIcon.toLowerCase();
  if (lower.includes('oil') || lower.includes('oli')) return 'opacity';
  if (lower.includes('brake') || lower.includes('rem')) return 'build';
  if (lower.includes('battery') || lower.includes('aki')) return 'battery-charging-full';
  if (lower.includes('cvt') || lower.includes('transmission') || lower.includes('gear')) return 'settings';
  if (lower.includes('air') || lower.includes('filter') || lower.includes('udara')) return 'air';
  if (lower.includes('tire') || lower.includes('tyre') || lower.includes('ban')) return 'tire-repair';
  if (lower.includes('coolant') || lower.includes('radiator') || lower.includes('water')) return 'water-drop';
  if (lower.includes('spark') || lower.includes('busi') || lower.includes('electric')) return 'electric-bolt';
  if (lower.includes('clean') || lower.includes('wash') || lower.includes('cuci')) return 'cleaning-services';
  if (lower.includes('speed') || lower.includes('rpm')) return 'speed';
  return 'construction';
}
