/**
 * A single FontAwesome glyph.
 *
 * Every icon here is decorative: it always sits beside a text label that carries
 * the meaning, so the SVG is hidden from assistive tech instead of being given a
 * name of its own. Otherwise a screen reader announces "money in icon" ahead of
 * the label that actually matters.
 *
 * FontAwesome's own stylesheet is deliberately not loaded - it would override
 * the app's own button and form styling. The one rule this component actually
 * needs, `.fa-icon`, is declared in index.css.
 */

import { icon } from '@fortawesome/fontawesome-svg-core'

import { ICONS, type IconName } from '@/lib/icons'

export interface IconProps {
  name: IconName
  /** Extra classes for sizing and colour, e.g. `text-[13px] text-accent2`. */
  className?: string
}

export function Icon({ name, className = '' }: IconProps) {
  const glyph = icon(ICONS[name], { classes: 'fa-icon' })
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      dangerouslySetInnerHTML={{ __html: glyph.html.join('') }}
    />
  )
}
