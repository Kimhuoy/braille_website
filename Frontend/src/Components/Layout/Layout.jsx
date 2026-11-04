import React from "react";
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
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
