import React from 'react'
import { Link, NavLink } from 'react-router-dom'

/** Public Home and authentication shell. Dashboard sidebars are deliberately not used here. */
export default function PublicAccessLayout({ page = 'home', children }) {
  return (
    <div className="sdrc-public">
      <div className="sdrc-public-accent" aria-hidden="true" />
      <header className="sdrc-public-header">
        <div className="sdrc-public-header-inner">
          <Link className="sdrc-public-brand" to="/" aria-label="Student Document Requisition and Certificate Portal home">
            <span className="sdrc-public-mark" aria-hidden="true">SD</span>
            <span>Student Document and Certificate Requisition Portal</span>
          </Link>
          <nav className="sdrc-public-links" aria-label="Public navigation">
            <NavLink to="/" end className={({ isActive }) => `sdrc-public-navlink${isActive ? ' current' : ''}`}>Home</NavLink>
            <NavLink to="/employee" className={({ isActive }) => `sdrc-public-navlink${isActive ? ' current' : ''}`}>Staff Login</NavLink>
            <NavLink to="/student" className={({ isActive }) => `sdrc-public-navlink sdrc-public-login-link${isActive ? ' current' : ''}`}>Student Login</NavLink>
          </nav>
        </div>
      </header>
      <main className={`sdrc-public-content${page === 'home' ? ' sdrc-public-content-home' : ''}`}>
        {children}
      </main>
    </div>
  )
}
