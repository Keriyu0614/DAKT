import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "react-toastify/dist/ReactToastify.css";

const GOOGLE_CLIENT_ID = "606890091839-cabq6kfrt1i2pctssr54ctli4no5lhcq.apps.googleusercontent.com";

export default function App() {
  console.log("API BASE URL:", import.meta.env.VITE_API_BASE_URL);
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppRoutes />
      <ToastContainer position="top-right" autoClose={3000} />
    </GoogleOAuthProvider>
  );
}
