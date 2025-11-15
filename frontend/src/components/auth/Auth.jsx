import React from "react";
import { Routes, Route } from "react-router-dom";
import GetStarted from "./GetStarted";
import Signup from "./Signup";
import Login from "./Login";
// import { UserProvider } from "../../context/UserContext";
function Auth() {
  return (
    // <UserProvider>
    <Routes>
      <Route path="/" element={<GetStarted />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
    </Routes>
    //  </UserProvider>
  );
}

export default Auth;
