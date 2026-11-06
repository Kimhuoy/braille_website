import React from "react";
import HomePage from "./Components/Home/homepage";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import Layout from "./Components/Layout/Layout";
import Guideline from "./Components/Home/guideline-page";
import AboutUs from "./Components/Home/about-us";
import PrinterGuide from "./Components/Home/printer-guide";
import Contribute from "./Components/Home/contribute-page";
import Feedback from "./Components/Home/feedback-page";
import Admin from "./Components/Home/admin-page";
import { ADMIN_PAGE_ENABLED } from "./config/forms";

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <HomePage />,
        },
        {
          path: "/guideline",
          element: <Guideline />,
        },
        {
          path: "/about",
          element: <AboutUs />,
        },
        {
          path: "/printer-guide",
          element: <PrinterGuide />,
        },
        {
          path: "/contribute",
          element: <Contribute />,
        },
        {
          path: "/feedback",
          element: <Feedback />,
        },
        {
          path: "/admin",
          element: ADMIN_PAGE_ENABLED ? <Admin /> : <Navigate to="/" replace />,
        },
        {
          // Any other address (a typo, an old link) goes to the home page
          // instead of React Router's raw error screen.
          path: "*",
          element: <Navigate to="/" replace />,
        },
      ],
    },
  ]);

  return (
    <div>
      <RouterProvider router={router} />
    </div>
  );
};

export default App;
