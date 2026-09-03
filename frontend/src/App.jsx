import { Navigate, Route, Routes } from "react-router";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import PageLoader from "./components/PageLoader";
import { initTabNotifier } from "./lib/tabNotifier";

import { Toaster } from "react-hot-toast";

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();

  useEffect(() => {
    checkAuth();
    initTabNotifier();
  }, [checkAuth]);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <>
    <div className="h-[100dvh] w-full bg-[#0b0f17] relative flex items-center justify-center overflow-hidden">
      <Routes>
        <Route path="/" element={authUser ? <ChatPage /> : <Navigate to="/login" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
      </Routes>
    </div>

    <Toaster position="top-center" reverseOrder={false} />
  </>
  );
}
export default App;