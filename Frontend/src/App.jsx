import { lazy } from "react";
import HomePage from "./Components/Home/homepage";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import Layout from "./Components/Layout/Layout";

// The translator (home page) loads with the site; every other page is fetched
// the first time someone opens it, so the first visit downloads less JavaScript.
const Guideline = lazy(() => import("./Components/Home/guideline-page"));
const AboutUs = lazy(() => import("./Components/Home/about-us"));
const PrinterGuide = lazy(() => import("./Components/Home/printer-guide"));
const Contribute = lazy(() => import("./Components/Home/contribute-page"));
const Feedback = lazy(() => import("./Components/Home/feedback-page"));
const Admin = lazy(() => import("./Components/Home/admin-page"));
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
