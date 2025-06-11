import Index from "views/Index.js";
import Register from "views/auth/Register";
import Login from "views/auth/Login";
import Tables from "views/examples/Tables.js";
import Icons from "views/examples/Icons.js";

import ExcelUploads from "views/reconciliation/ExcelUploads";

var routes = [
  {
    path: "/index",
    name: "Dashboard",
    icon: "ni ni-tv-2 text-primary",
    component: <Index />,
    layout: "/admin",
  },
  {
    path: "/icons",
    name: "Icons",
    icon: "ni ni-planet text-blue",
    component: <Icons />,
    layout: "/admin",
  },

  {
    path: "/lists/:id?",
    name: "Icons",
    icon: "ni ni-planet text-blue",
    component: <ExcelUploads />,
    layout: "/admin",
  },

  {
    path: "/tables",
    name: "Tables",
    icon: "ni ni-bullet-list-67 text-red",
    component: <Tables />,
    layout: "/admin",
  },
  {
    path: "/login",
    name: "Login",
    icon: "ni ni-key-25 text-info",
    component: <Login />,
    layout: "/auth",
  },
  {
    path: "/register",
    name: "Register",
    icon: "ni ni-circle-08 text-pink",
    component: <Register />,
    layout: "/auth",
  },
];
export default routes;
