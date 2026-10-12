import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import Page from '../components/Page'
import { useAuth } from '../context/AuthContext'
import { homePathFor } from '../data/navItems'

export default function NotFound() {
  const { user } = useAuth()
  return (
    <Page title="Not Found">
      <div className="card">
        <EmptyState icon="warning" title="This page doesn’t exist">
          The link may be out of date, or the page may have moved.
        </EmptyState>
        <div className="px-4 pb-5">
          <Link className="button button--tinted" to={homePathFor(user)}>
            Go Home
          </Link>
        </div>
      </div>
    </Page>
  )
}
