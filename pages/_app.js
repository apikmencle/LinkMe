import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { SitesProvider } from '../context/SitesContext';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <SitesProvider>
        <Component {...pageProps} />
      </SitesProvider>
    </AuthProvider>
  );
}
