import React from "react";
import { Link } from "react-router-dom";
import appStore from "../../store/app";
import { useT } from "../../i18n";

const Footer = () => {
  const { interfaceLang } = appStore();
  const tn = useT(interfaceLang).nav;
  const tf = useT(interfaceLang).footer;

  return (
    <footer className="bg-BlueDark text-white mt-12">
      <div className="w-[90%] sm:w-[88%] lg:w-[85%] max-w-[1600px] mx-auto lg:grid lg:grid-cols-3 md:grid md:grid-cols-3 gap-6 py-10">
        <div>
          <h2 className="text-lg font-bold mb-4">{tf.locationTitle}</h2>
          <p className="text-sm text-gray-200">{tf.locationText}</p>
        </div>

        <nav aria-label="Footer">
          <ul className="text-base space-y-3">
            <li>
              <Link to="/" className="hover:underline">
                {tn.home}
              </Link>
            </li>
            <li>
              <Link to="/feedback" className="hover:underline">
                {tn.feedback}
              </Link>
            </li>
            <li>
              <Link to="/guideline" className="hover:underline">
                {tn.help}
              </Link>
            </li>
            <li>
              <Link to="/contribute" className="hover:underline">
                {tn.contribute}
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:underline">
                {tn.about}
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-lg font-bold mb-4">{tf.contactTitle}</h2>
          <ul className="text-sm text-gray-200 space-y-2">
            <li>
              <span className="font-bold">{tf.phoneLabel}:</span> +855 10 344
              040
            </li>
            <li>
              <span className="font-bold">{tf.emailLabel}:</span>{" "}
              pr@cadt.edu.kh
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/20 px-6 py-4 text-center">
        <p className="text-xs text-gray-300">
          {tf.copyright} — {tf.tagline}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
