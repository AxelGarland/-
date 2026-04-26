import { useEffect, useId, useMemo, useState } from 'react'
import { demoRoleSelectOptions } from '../data/demoRoles.js'
import { getPositionLabel } from '../data/positions.js'

const roleOptions = demoRoleSelectOptions.filter((opt) => opt.value)

function normalizeRoleLabel(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('he')
}

export default function RoleSearchInput({
  value,
  onChange,
  disabled = false,
  required = false,
  name = 'role',
}) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const optionsByLabel = useMemo(() => {
    return new Map(roleOptions.map((opt) => [normalizeRoleLabel(opt.label), opt.value]))
  }, [])

  const visibleOptions = useMemo(() => {
    const normalizedQuery = normalizeRoleLabel(query)
    if (!normalizedQuery) return roleOptions
    return roleOptions.filter((opt) => normalizeRoleLabel(opt.label).includes(normalizedQuery))
  }, [query])

  useEffect(() => {
    if (value) setQuery(getPositionLabel(value))
  }, [value])

  function handleChange(e) {
    const nextQuery = e.target.value
    setQuery(nextQuery)
    setIsOpen(true)
    onChange(optionsByLabel.get(normalizeRoleLabel(nextQuery)) ?? '')
  }

  function handleSelect(opt) {
    setQuery(opt.label)
    setIsOpen(false)
    onChange(opt.value)
  }

  return (
    <div className="role-search" dir="rtl">
      <input
        className="form-input"
        name={name}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        value={query}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        placeholder="התחילו להקליד ובחרו תפקיד"
        autoComplete="off"
        disabled={disabled}
        required={required}
      />
      {isOpen && !disabled ? (
        <div id={listId} className="role-search-menu" role="listbox">
          {visibleOptions.length > 0 ? (
            visibleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="role-search-option"
                role="option"
                aria-selected={value === opt.value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt)}
              >
                {opt.label}
              </button>
            ))
          ) : (
            <div className="role-search-empty">לא נמצאו תפקידים מתאימים</div>
          )}
        </div>
      ) : null}
    </div>
  )
}
