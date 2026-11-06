import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./nav-bar";
import Footer from "./footer";

const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        រំលងទៅមាតិកាចម្បង / Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">
        {/* Pages other than the translator load on first visit (App.jsx) */}
        <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
