import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LocationGate } from './auth/LocationGate';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { CharacterCreatePage } from './pages/CharacterCreatePage';
import { CharacterListPage } from './pages/CharacterListPage';
import { CharacterSheetPage } from './pages/CharacterSheetPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TownPage } from './pages/TownPage';
import { WorldPage } from './pages/WorldPage';
import { WorldSelectPage } from './pages/WorldSelectPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<CharacterListPage />} />
            <Route path="/characters/new" element={<CharacterCreatePage />} />
            <Route path="/characters/:id" element={<CharacterSheetPage />} />
            <Route path="/characters/:id/worlds" element={<WorldSelectPage />} />
            <Route element={<LocationGate />}>
              <Route
                path="/characters/:id/worlds/:worldId"
                element={<WorldPage />}
              />
              <Route
                path="/characters/:id/worlds/:worldId/towns/:settlementId"
                element={<TownPage />}
              />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
