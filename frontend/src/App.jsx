import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import CadastroVeiculo from './pages/CadastroVeiculo'
import ListaVeiculos from './pages/ListaVeiculos'
import DetalhesVeiculo from './pages/DetalhesVeiculo'

function Navigation() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700';
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gerenciador de Veículos</h1>
          <div className="flex gap-4">
            <Link
              to="/"
              className={`${isActive('/')} px-6 py-2 rounded-lg transition`}
            >
              Cadastrar Veículo
            </Link>
            <Link
              to="/veiculos"
              className={`${isActive('/veiculos')} px-6 py-2 rounded-lg transition`}
            >
              Ver Veículos
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<CadastroVeiculo />} />
          <Route path="/veiculos" element={<ListaVeiculos />} />
          <Route path="/veiculo/:id" element={<DetalhesVeiculo />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
