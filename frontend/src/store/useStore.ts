import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppInfo {
  id: string;
  name: string;
  icon?: string;
  developer?: string;
}

interface MyApp {
  id: string;
  name: string;
  icon?: string;
  developer?: string;
  addedAt: string;
}

interface AppStore {
  selectedCountry: string
  setSelectedCountry: (country: string) => void
  recentSearches: string[]
  addRecentSearch: (keyword: string) => void
  selectedAppId: string | null
  setSelectedAppId: (id: string | null) => void
  trackedApps: AppInfo[]
  addTrackedApp: (app: AppInfo) => void
  removeTrackedApp: (id: string) => void
  myApps: MyApp[]
  addMyApp: (app: MyApp) => void
  removeMyApp: (id: string) => void
  theme: 'dark' | 'light'
  toggleTheme: () => void
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      selectedCountry: 'us',
      setSelectedCountry: (country) => set({ selectedCountry: country }),

      recentSearches: [],
      addRecentSearch: (keyword) =>
        set((state) => ({
          recentSearches: [
            keyword,
            ...state.recentSearches.filter((k) => k !== keyword),
          ].slice(0, 10),
        })),

      selectedAppId: null,
      setSelectedAppId: (id) => set({ selectedAppId: id }),

      trackedApps: [],
      addTrackedApp: (app) =>
        set((state) => ({
          trackedApps: [...state.trackedApps.filter((a) => a.id !== app.id), app],
        })),

      removeTrackedApp: (id) =>
        set((state) => ({
          trackedApps: state.trackedApps.filter((a) => a.id !== id),
          selectedAppId: state.selectedAppId === id ? null : state.selectedAppId,
        })),

      myApps: [],
      addMyApp: (app) =>
        set((state) => {
          const exists = state.myApps.find((a) => a.id === app.id);
          if (exists) return state;
          return {
            myApps: [...state.myApps, { ...app, addedAt: new Date().toISOString() }],
          };
        }),

      removeMyApp: (id) =>
        set((state) => ({
          myApps: state.myApps.filter((app) => app.id !== id),
        })),

      theme: 'dark',
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark'
          document.documentElement.classList.toggle('dark', newTheme === 'dark')
          return { theme: newTheme }
        }),
    }),
    {
      name: 'aso-storage',
      onRehydrateStorage: () => (state) => {
        // Set theme on load
        if (state) {
          document.documentElement.classList.toggle('dark', state.theme === 'dark')
        }
      },
    }
  )
)
