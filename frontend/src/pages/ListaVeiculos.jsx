import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function ListaVeiculos() {
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarVeiculos();
  }, []);

  const carregarVeiculos = async () => {
    try {
      const response = await api.get('/veiculos');
      setVeiculos(response.data);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      alert('Erro ao carregar veículos');
    } finally {
      setLoading(false);
    }
  };

  const formatarPreco = (preco) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  };

  const excluirVeiculo = async (id, e) => {
    e.preventDefault(); // Prevenir navegação do Link
    e.stopPropagation();
    
    if (!confirm('Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await api.delete(`/veiculos/${id}`);
      alert('Veículo excluído com sucesso!');
      carregarVeiculos();
    } catch (error) {
      console.error('Erro ao excluir veículo:', error);
      alert('Erro ao excluir veículo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Veículos Cadastrados</h1>

      {veiculos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-lg mb-4">Nenhum veículo cadastrado ainda</p>
          <Link
            to="/"
            className="text-blue-600 hover:underline text-lg"
          >
            Cadastrar primeiro veículo →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {veiculos.map(veiculo => (
            <div
              key={veiculo.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
            >
              <Link to={`/veiculo/${veiculo.id}`}>
                <div className="h-48 bg-gray-200">
                  {veiculo.fotos && veiculo.fotos.length > 0 ? (
                    <img
                      src={veiculo.fotos[0].url}
                      alt={`${veiculo.marca} ${veiculo.modelo}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sem foto
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="text-xs text-gray-500 mb-1">{veiculo.tipo_veiculo}</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {veiculo.marca} {veiculo.modelo}
                  </h3>
                  {veiculo.versao && (
                    <p className="text-sm text-gray-600 mb-2">{veiculo.versao}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>{veiculo.ano_modelo}</span>
                    <span>•</span>
                    <span>{veiculo.quilometragem.toLocaleString('pt-BR')} km</span>
                  </div>

                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded">{veiculo.combustivel}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">{veiculo.cambio}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">{veiculo.cor}</span>
                  </div>

                  <div className="text-2xl font-bold text-blue-600">
                    {formatarPreco(veiculo.preco)}
                  </div>
                </div>
              </Link>
              
              <div className="px-4 pb-4 flex gap-2">
                <Link
                  to={`/veiculo/${veiculo.id}`}
                  className="flex-1 bg-blue-600 text-white text-center px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Ver Detalhes
                </Link>
                <button
                  onClick={(e) => excluirVeiculo(veiculo.id, e)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
