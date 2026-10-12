import Icon from './Icon'

/**
 * iOS-style search field. Controlled by the caller so the Dashboard can feed
 * the raw value straight back (instant typing) while handing a *deferred*
 * copy to the expensive filtering — see Dashboard.jsx.
 */
export default function SearchField({ value, onChange, placeholder = 'Search' }) {
  return (
    <div className="search-field">
      <Icon name="search" className="search-field__icon" />
      <input
        type="search"
        className="search-field__input"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <button
          type="button"
          className="search-field__clear"
          aria-label="Clear search"
          onClick={() => onChange('')}
        >
          <Icon name="close" />
        </button>
      )}
    </div>
  )
}
