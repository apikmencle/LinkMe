import { createContext, useContext } from 'react';
import { useSites as useSitesState } from '../lib/useSites';

const SitesContext = createContext(null);

// Membungkus hook useSites() supaya statenya (situs yang dipilih, daftar
// situs, dst) dibagi bersama oleh Header (site switcher) dan semua halaman
// di dalam dashboard - jadi pilihan situs tetap sama saat pindah halaman
// (Dashboard -> Insight -> Real-Time), tanpa perlu render ulang card
// pemilih situs di tiap halaman.
export function SitesProvider({ children }) {
  const value = useSitesState();
  return <SitesContext.Provider value={value}>{children}</SitesContext.Provider>;
}

export function useSitesContext() {
  const ctx = useContext(SitesContext);
  if (!ctx) {
    throw new Error('useSitesContext harus dipakai di dalam <SitesProvider>');
  }
  return ctx;
}
