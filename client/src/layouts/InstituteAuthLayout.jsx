import { Link, Outlet } from "react-router-dom";
import "../styles/Auth.css";

function InstituteAuthLayout() {
  return (
    <div className="institute-auth-shell">
      <header className="institute-auth-header">
        <Link to="/" className="institute-auth-brand" aria-label="EduFind Home">
          <span className="institute-brand-pill">
            <img
              src="/images/edufind-logo-clean.png"
              alt="EduFind"
              className="institute-brand-logo"
            />
          </span>
          <span className="institute-auth-tag">Institute</span>
        </Link>
        <Link to="/" className="institute-auth-back">
          ← Back to EduFind
        </Link>
      </header>
      <main className="institute-auth-main institute-auth-main--scroll">
        <Outlet />
      </main>
    </div>
  );
}

export default InstituteAuthLayout;
