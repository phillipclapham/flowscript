/**
 * FlowScript Web Application
 * Multi-page layout with shared navigation.
 */

import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import { ThemeToggle } from "./components/ThemeToggle";
import { Landing } from "./pages/Landing";
import { Learn } from "./pages/Learn";
import { GetStarted } from "./pages/GetStarted";
import { Playground } from "./pages/Playground";
import "./App.css";

function Layout() {
  const location = useLocation();
  const isPlayground = location.pathname === "/playground";

  return (
    <div className={`app ${isPlayground ? 'app--playground' : 'app--page'}`}>
      {/* Navigation */}
      <header className="app-header">
        <div className="header-content">
          <NavLink to="/" className="logo-link">
            <h1 className="logo">
              <span className="logo-icon">&#x26A1;</span>
              FlowScript
            </h1>
          </NavLink>

          <nav className="main-nav">
            <NavLink to="/learn" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Learn
            </NavLink>
            <NavLink to="/get-started" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Get Started
            </NavLink>
            <NavLink to="/playground" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Playground
            </NavLink>
          </nav>

          <div className="header-actions">
            <a
              href="https://github.com/phillipclapham/flowscript"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link github-link"
              title="GitHub"
            >
              GitHub
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className={isPlayground ? 'app-main app-main--playground' : 'app-main app-main--page'}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/playground" element={<Playground />} />
        </Routes>
      </main>

      {/* Footer — compact on playground, full on other pages */}
      <footer className={`app-footer ${isPlayground ? 'app-footer--compact' : ''}`}>
        <div className="footer-content">
          {!isPlayground && (
            <p>
              FlowScript &mdash; Decision Intelligence for AI Agents
            </p>
          )}
          <p className="footer-links">
            <a href="https://github.com/phillipclapham/flowscript" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <span className="footer-sep">&middot;</span>
            <a href="https://www.npmjs.com/package/flowscript-core" target="_blank" rel="noopener noreferrer">
              npm
            </a>
            <span className="footer-sep">&middot;</span>
            <a href="https://pypi.org/project/flowscript-agents/" target="_blank" rel="noopener noreferrer">
              PyPI
            </a>
            <span className="footer-sep">&middot;</span>
            <a href="https://github.com/phillipclapham/flowscript/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">
              MIT License
            </a>
          </p>
          {!isPlayground && (
            <p className="footer-attribution">
              Built by <a href="https://phillipclapham.com" target="_blank" rel="noopener noreferrer">Phillip Clapham</a>
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
