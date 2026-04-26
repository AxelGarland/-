import { positions } from './positions.js'

/**
 * אפשרויות תפריט «תפקיד באלוט» — מסונכרנות עם positions.js (ממוינות שם לפי א״ב).
 */
export const demoRoleSelectOptions = [
  { value: '', label: 'בחרו תפקיד', disabled: false },
  ...positions.map((p) => ({ value: p.id, label: p.label, disabled: false })),
]

export function isValidDemoRoleId(value) {
  return Boolean(value) && positions.some((p) => p.id === value)
}
