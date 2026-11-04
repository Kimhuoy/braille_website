// Navbar.js

import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import appStore from "../../store/app";
import { useT } from "../../i18n";
import idri_logo from "../../assets/idri-logo.png";
import cadt_logo from "../../assets/cadt-logo.png";
import "../../Styles/NavBar.css";

const Navbar = () => {
  const { nav, setNav, interfaceLang, setInterfaceLang } = appStore();
  const t = useT(interfaceLang).nav;

  const toggleInterfaceLang = () => {
    setInterfaceLang(interfaceLang === "km" ? "en" : "km");
  };

  const navItems = [
    { to: "/", label: t.home, icon: "ion:home-outline" },
    { to: "/feedback", label: t.feedback, icon: "material-symbols:feedback-outline-rounded" },
    { to: "/guideline", label: t.help, icon: "bx:support" },
    { to: "/printer-guide", label: t.printer, icon: "mdi:printer-outline" },
    { to: "/contribute", label: t.contribute, icon: "mdi:hand-heart-outline" },
    { to: "/about", label: t.about, icon: "mingcute:information-line" },
  ];

  return (
    <div>
      {/* Top header bar */}
      <header className="w-full fixed left-0 z-20 top-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="w-[90%] sm:w-[88%] lg:w-[85%] max-w-[1600px] mx-auto flex items-center justify-between py-2.5 lg:py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNav(!nav)}
              aria-label={nav ? t.closeMenu : t.openMenu}
              aria-expanded={nav}
              className="xl:hidden inline-flex items-center justify-center rounded-md p-2 mr-1 cursor-pointer hover:bg-gray-100"
            >
              <Icon icon="mynaui:menu" className="text-2xl text-BlueDark" aria-hidden="true" />
            </button>
            <img
              src={idri_logo}
              alt="IDRI — Institute of Digital Research & Innovation"
              className="h-6 md:h-7 lg:h-8"
            />
          </div>

          <nav
            aria-label="Primary"
            className="hidden xl:flex items-center navBar"
          >
            <ul className="flex items-center gap-1">
              {navItems.map((item, i) =>
                item.to ? (
                  <li key={i}>
                    <Link
                      to={item.to}
                      className="nav-link block whitespace-nowrap px-3 2xl:px-4 py-2 rounded-md font-bold text-base 2xl:text-lg text-BlueDark hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ) : (
                  <li key={i}>
                    <a
                      href={item.href}
                      className="nav-link block whitespace-nowrap px-3 2xl:px-4 py-2 rounded-md font-bold text-base 2xl:text-lg text-BlueDark hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                )
              )}
            </ul>
          </nav>

          <div className="flex items-center gap-3 md:gap-4">
            <img
              src={cadt_logo}
              alt="CADT — Cambodia Academy of Digital Technology"
              className="hidden sm:block h-6 md:h-7 lg:h-8"
            />
            <button
              type="button"
              onClick={toggleInterfaceLang}
              aria-label={t.langToggleLabel}
              className="border-2 border-BlueDark text-BlueDark font-bold text-sm md:text-base rounded-full px-3 md:px-4 py-1.5 hover:bg-BlueDark hover:text-white transition-colors"
            >
              {t.langToggleShort}
            </button>
          </div>
        </div>
      </header>

      {/* spacer so fixed header doesn't overlap content */}
      <div className="h-[52px] md:h-[60px] lg:h-[64px]" aria-hidden="true"></div>

      {/* Mobile menu overlay */}
      {nav && (
        <div
          className="bg-black/30 fixed w-full h-screen z-10 top-0 left-0"
          onClick={() => setNav(!nav)}
          aria-hidden="true"
        ></div>
      )}

      {/* Mobile side drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.openMenu}
        className={
          nav
            ? "fixed top-0 left-0 w-[75%] sm:w-[40%] h-screen bg-white z-50 duration-300 shadow-xl"
            : "fixed top-0 left-[-100%] sm:w-[450px] h-screen z-50 bg-white duration-300"
        }
      >
        <div className="flex items-center gap-4 border-b border-gray-100 pb-3">
          <button
            type="button"
            onClick={() => setNav(!nav)}
            aria-label={t.closeMenu}
            className="mt-4 ml-4 p-1 rounded hover:bg-gray-100"
          >
            <Icon icon="material-symbols:close" className="text-2xl text-BlueDark" aria-hidden="true" />
          </button>
          <img src={idri_logo} alt="IDRI logo" className="h-8 mt-4" />
        </div>
        <nav aria-label="Mobile" className="mt-4 mx-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item, i) => (
              <li key={i} onClick={() => setNav(!nav)}>
                {item.to ? (
                  <Link
                    to={item.to}
                    className="text-lg lg:text-base py-3 px-2 rounded-md flex items-center font-bold text-BlueDark hover:bg-blue-50"
                  >
                    <Icon icon={item.icon} className="text-2xl mr-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className="text-lg lg:text-base py-3 px-2 rounded-md flex items-center font-bold text-BlueDark hover:bg-blue-50"
                  >
                    <Icon icon={item.icon} className="text-2xl mr-4" aria-hidden="true" />
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Navbar;
