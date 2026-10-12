import { errorMessage } from '../api/client'
import EmptyState from './EmptyState'

/** Placeholder rows while a list loads for the first time. */
export function LoadingRows({ count = 4, thumb = false }) {
  return (
    <div className="card" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="row">
          {thumb && <span className="skeleton h-[46px] w-[60px] flex-none" />}
          <span className="flex flex-1 flex-col gap-2">
            <span className="skeleton h-3.5 w-2/5" />
            <span className="skeleton h-3 w-3/5" />
          </span>
        </div>
      ))}
    </div>
  )
}

/** A failed load, with the server's own explanation and a way to retry. */
export function LoadError({ error, onRetry }) {
  return (
    <div className="card">
      <EmptyState icon="warning" title="Couldn’t Load">
        {errorMessage(error)}
      </EmptyState>
      {onRetry && (
        <div className="px-4 pb-5">
          <button type="button" className="button button--tinted" onClick={onRetry}>
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
