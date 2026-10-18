import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AnimatePresence,
  motion,
  useDragControls,
  useIsPresent,
  useReducedMotion,
} from 'motion/react'
import { SPRING, SPRING_SNAPPY, SPRING_MOMENTUM, projectMomentum } from '../motion/transitions'
import Icon from './Icon'

/* Widths of the simulated screen (`.viewport`) where the presentation changes.
   They mirror the container-query breakpoints in components.css: below 700 is
   the phone layout, 700–899 the tablet layout, 900+ the sidebar layout. */
const TABLET_MIN = 700
const DESKTOP_MIN = 900

const DROPDOWN_WIDTH = 224
const DROPDOWN_ROW = 40
const DROPDOWN_MAX_HEIGHT = 264
const EDGE = 12

const modeFor = (width) => (width >= DESKTOP_MIN ? 'dropdown' : width >= TABLET_MIN ? 'center' : 'sheet')

/**
 * An iOS-style single-choice row for a grouped form card.
 *
 * The native <select> opens an oversized, unstyled browser popup that ignores
 * the device preview. This opens a picker drawn by the app instead, shaped by
 * the screen it is on:
 *
 *  - phone     a bottom sheet (draggable down to dismiss)
 *  - tablet    a centred sheet
 *  - desktop   a compact dropdown anchored under the field
 *
 * The screen is the simulated `.viewport`, not the real window, so the picker
 * follows the Tablet / Phone previews. Choosing an option closes the picker.
 *
 * @param {{value: string|number, label: string}[]} options
 * @param {string|number} value
 * @param {(value: string|number) => void} onChange
 * @param {string} [title]  heading of the sheet and its accessible name
 */
export default function PickerField({
  id,
  label,
  title = label,
  value,
  options,
  onChange,
  onBlur,
  invalid = false,
}) {
  const triggerRef = useRef(null)
  const [host, setHost] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const selected = options.find((option) => String(option.value) === String(value))

  // The picker is drawn inside the device screen so the frame clips it and
  // the container queries (and scale) of the preview apply to it.
  useEffect(() => {
    setHost(triggerRef.current?.closest('.viewport') ?? document.body)
  }, [])

  const close = useCallback(
    ({ restoreFocus = true } = {}) => {
      setIsOpen(false)
      onBlur?.()
      if (restoreFocus) triggerRef.current?.focus()
    },
    [onBlur],
  )

  const handleSelect = (nextValue) => {
    onChange(nextValue)
    close()
  }

  return (
    <div className={`field${invalid ? ' field--invalid' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="picker-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
      >
        <span>{selected?.label ?? 'Select'}</span>
        <Icon name="chevronUpDown" className="picker-trigger__chevron" />
      </button>

      {host &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <PickerLayer
                host={host}
                trigger={triggerRef}
                title={title}
                options={options}
                value={value}
                onSelect={handleSelect}
                onClose={close}
              />
            )}
          </AnimatePresence>,
          host,
        )}
    </div>
  )
}

/** Width of the screen the picker lives in, kept current while it is open. */
function useScreenMode(host) {
  const [mode, setMode] = useState(() => modeFor(host.clientWidth))
  useEffect(() => {
    const observer = new ResizeObserver(() => setMode(modeFor(host.clientWidth)))
    observer.observe(host)
    return () => observer.disconnect()
  }, [host])
  return mode
}

/**
 * Where the dropdown goes: under the field's row, right edges aligned (the
 * value is right-aligned), flipped above when there is more room there, and
 * capped to the space available so it can never run off the screen.
 */
function placeDropdown(host, trigger, optionCount) {
  const screen = host.getBoundingClientRect()
  // The preview frame can be scaled; convert page pixels to the screen's own.
  const scale = screen.width / host.offsetWidth || 1
  const anchor = trigger.getBoundingClientRect()
  const row = trigger.closest('.field')?.getBoundingClientRect() ?? anchor
  const height = host.clientHeight

  const room = Math.min(optionCount * DROPDOWN_ROW + 12, DROPDOWN_MAX_HEIGHT)
  const below = height - (row.bottom - screen.top) / scale - EDGE
  const above = (row.top - screen.top) / scale - 64 // clear of the page header
  const placeBelow = below >= room || below >= above

  const style = {
    width: Math.min(DROPDOWN_WIDTH, host.clientWidth - EDGE * 2),
    maxHeight: Math.max(120, Math.min(DROPDOWN_MAX_HEIGHT, placeBelow ? below : above)),
    right: Math.max(EDGE, (screen.right - anchor.right) / scale),
  }
  if (placeBelow) style.top = (row.bottom - screen.top) / scale + 6
  else style.bottom = (screen.bottom - row.top) / scale + 6
  return { style, placeBelow }
}

function PickerLayer({ host, trigger, title, options, value, onSelect, onClose }) {
  const prefersReducedMotion = useReducedMotion()
  const mode = useScreenMode(host)
  const [placement, setPlacement] = useState(null)
  const dragControls = useDragControls()

  useLayoutEffect(() => {
    if (mode !== 'dropdown' || !trigger.current) return undefined
    const update = () => setPlacement(placeDropdown(host, trigger.current, options.length))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(host)
    return () => observer.disconnect()
  }, [mode, host, trigger, options.length])

  // A dropdown is pinned to its field, so it closes when the page scrolls
  // away from it (as a native menu does). Scrolling its own list is fine.
  const panelRef = useRef(null)
  useEffect(() => {
    if (mode !== 'dropdown') return undefined
    const handleScroll = (event) => {
      if (!panelRef.current?.contains(event.target)) onClose({ restoreFocus: false })
    }
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [mode, onClose])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Dropdown geometry is measured before paint; hold the first frame until it is.
  if (mode === 'dropdown' && !placement) return null

  const isSheet = mode === 'sheet'
  const motionProps = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : isSheet
      ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: SPRING }
      : mode === 'center'
        ? {
            initial: { opacity: 0, scale: 0.96 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.96 },
            transition: SPRING_SNAPPY,
          }
        : {
            initial: { opacity: 0, scale: 0.97, y: placement.placeBelow ? -4 : 4 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.97 },
            transition: { duration: 0.14 },
          }

  const handleDragEnd = (_event, info) => {
    const projected = info.offset.y + projectMomentum(info.velocity.y)
    if (info.velocity.y > 350 || projected > 120) onClose()
  }

  return (
    <>
      <motion.div
        className={`picker-scrim${mode === 'dropdown' ? ' picker-scrim--clear' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => onClose()}
      />
      <motion.div
        ref={panelRef}
        key={mode}
        className={`picker picker--${mode}`}
        style={mode === 'dropdown' ? { ...placement.style, transformOrigin: placement.placeBelow ? 'top right' : 'bottom right' } : undefined}
        role={mode === 'dropdown' ? undefined : 'dialog'}
        aria-modal={mode === 'dropdown' ? undefined : true}
        aria-label={mode === 'dropdown' ? undefined : title}
        {...motionProps}
        drag={isSheet && !prefersReducedMotion ? 'y' : false}
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0 }}
        dragElastic={0.08}
        dragTransition={SPRING_MOMENTUM}
        onDragEnd={handleDragEnd}
      >
        <PickerContent
          mode={mode}
          title={title}
          options={options}
          value={value}
          panelRef={panelRef}
          dragControls={dragControls}
          onSelect={onSelect}
          onClose={onClose}
        />
      </motion.div>
    </>
  )
}

/**
 * The header and the options. While the picker animates out it is still in
 * the DOM, so it is made inert — a quick second tap must not select again.
 */
function PickerContent({ mode, title, options, value, panelRef, dragControls, onSelect, onClose }) {
  const isPresent = useIsPresent()
  const listRef = useRef(null)
  const hasHeader = mode !== 'dropdown'

  // Open centred on the current choice, with focus on it for the keyboard.
  useLayoutEffect(() => {
    const list = listRef.current
    const current = list?.querySelector('[aria-selected="true"]') ?? list?.querySelector('[role="option"]')
    if (!current) return
    list.scrollTop = current.offsetTop - list.clientHeight / 2 + current.offsetHeight / 2
    current.focus({ preventScroll: true })
  }, [mode])

  const optionElements = () => Array.from(listRef.current?.querySelectorAll('[role="option"]') ?? [])

  const handleListKeyDown = (event) => {
    const items = optionElements()
    const index = items.indexOf(document.activeElement)
    const move = (next) => {
      event.preventDefault()
      items[Math.max(0, Math.min(items.length - 1, next))]?.focus()
    }
    if (event.key === 'ArrowDown') move(index + 1)
    else if (event.key === 'ArrowUp') move(index - 1)
    else if (event.key === 'Home') move(0)
    else if (event.key === 'End') move(items.length - 1)
    else if (event.key === 'PageDown') move(index + 5)
    else if (event.key === 'PageUp') move(index - 5)
  }

  const handleKeyDown = (event) => {
    if (event.key !== 'Tab') return
    if (mode === 'dropdown') {
      // Tabbing out of a menu closes it and carries on to the next field.
      onClose()
      return
    }
    // A sheet is modal: keep Tab inside it.
    const stops = Array.from(panelRef.current?.querySelectorAll('button, [tabindex="0"]') ?? [])
    if (!stops.length) return
    const first = stops[0]
    const last = stops[stops.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const tabStop = options.some((option) => String(option.value) === String(value))
    ? String(value)
    : String(options[0]?.value)

  return (
    <div className="picker__surface" inert={!isPresent} onKeyDown={handleKeyDown}>
      {hasHeader && (
        <div
          className="picker__header"
          onPointerDown={(event) => mode === 'sheet' && dragControls.start(event)}
        >
          {mode === 'sheet' && <div className="picker__grabber" aria-hidden="true" />}
          <div className="picker__bar">
            <button type="button" className="picker__cancel" onClick={() => onClose()}>
              Cancel
            </button>
            <p className="picker__title">{title}</p>
            <span className="picker__bar-spacer" aria-hidden="true" />
          </div>
        </div>
      )}

      <ul
        ref={listRef}
        className="picker__list"
        role="listbox"
        aria-label={title}
        onKeyDown={handleListKeyDown}
      >
        {options.map((option) => {
          const isSelected = String(option.value) === String(value)
          return (
            <li
              key={option.value}
              role="option"
              aria-selected={isSelected}
              tabIndex={String(option.value) === tabStop ? 0 : -1}
              className="picker__option"
              onClick={() => onSelect(option.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(option.value)
                }
              }}
            >
              <span>{option.label}</span>
              {isSelected && <Icon name="check" className="picker__check" />}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
