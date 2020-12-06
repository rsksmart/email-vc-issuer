import React from 'react'

const Nav = () => <nav className="navbar navbar-expand-md navbar-light bg-light fixed-top">
  <div className="container">
    <a className="navbar-brand" href="https://rifos.org" target="_blank" rel="noreferrer">
      <img src="https://rifos.org/assets/img/logo.svg" className="logo" alt="logo" />
    </a>
    <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarsExampleDefault" aria-controls="navbarsExampleDefault" aria-expanded="false" aria-label="Toggle navigation">
      <span className="navbar-toggler-icon"></span>
    </button>
    <div className="collapse navbar-collapse" id="navbarsExampleDefault">
      <ul className="navbar-nav ml-auto">
        <li className="nav-item">
            <a className="nav-link" href="https://developers.rsk.co/rif/identity" target="_blank" rel="noreferrer">RIF Identity docs</a>
        </li>
        <li className="nav-item">
            <a className="nav-link" href="https://github.com/rsksmart/email-vc-issuer" target="_blank" rel="noreferrer">Github</a>
        </li>
        <li className="nav-item">
            <a className="nav-link" href="https://developers.rsk.co/rif/identity/about" target="_blank" rel="noreferrer">Contact</a>
        </li>
      </ul>
    </div>
  </div>
</nav>

export default Nav
