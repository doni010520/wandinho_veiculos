import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function DetalhesVeiculo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [veiculo, setVeiculo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fotoAtual, setFotoAtual] = useState(0);

  useEffect(() => {
    carregarVeiculo();
  }, [id]);

  const carregarVeiculo = async () => {
    try {
      const response = await api.get(`/veiculos/${id}`);
      setVeiculo(response.data);
    } catch (error) {
      console.error('Erro ao carregar veículo:', error);
      alert('Erro ao carregar veículo');
      navigate('/veiculos');
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

  const atualizarStatus = async (novoStatus) => {
    if (!confirm(`Tem certeza que deseja marcar como ${novoStatus}?`)) return;

    try {
      await api.patch(`/veiculos/${id}/status`, { status: novoStatus });
      alert('Status atualizado com sucesso!');
      carregarVeiculo();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const deletarVeiculo = async () => {
    if (!confirm('Tem certeza que deseja deletar este veículo? Esta ação não pode ser desfeita.')) return;

    try {
      await api.delete(`/veiculos/${id}`);
      alert('Veículo deletado com sucesso!');
      navigate('/veiculos');
    } catch (error) {
      console.error('Erro ao deletar veículo:', error);
      alert('Erro ao deletar veículo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (!veiculo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Veículo não encontrado</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/veiculos" className="text-blue-600 hover:underline">← Voltar para lista</Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Galeria de Fotos */}
        {veiculo.fotos && veiculo.fotos.length > 0 && (
          <div className="relative">
            <div className="h-96 bg-gray-200">
              <img
                src={veiculo.fotos[fotoAtual]?.url}
                alt={`${veiculo.marca} ${veiculo.modelo}`}
                className="w-full h-full object-cover"
              />
            </div>

            {veiculo.fotos.length > 1 && (
              <>
                <button
                  onClick={() => setFotoAtual(prev => prev === 0 ? veiculo.fotos.length - 1 : prev - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70"
                >
                  ←
                </button>
                <button
                  onClick={() => setFotoAtual(prev => prev === veiculo.fotos.length - 1 ? 0 : prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70"
                >
                  →
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {veiculo.fotos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setFotoAtual(index)}
                      className={`w-2 h-2 rounded-full ${index === fotoAtual ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Thumbnails */}
            {veiculo.fotos.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {veiculo.fotos.map((foto, index) => (
                  <img
                    key={index}
                    src={foto.url}
                    alt={`Thumb ${index + 1}`}
                    onClick={() => setFotoAtual(index)}
                    className={`w-20 h-20 object-cover rounded cursor-pointer ${index === fotoAtual ? 'ring-2 ring-blue-600' : ''}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">{veiculo.tipo_veiculo}</div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {veiculo.marca} {veiculo.modelo}
              </h1>
              {veiculo.versao && <p className="text-xl text-gray-600">{veiculo.versao}</p>}
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {formatarPreco(veiculo.preco)}
              </div>
              <span className={`inline-block px-3 py-1 rounded text-sm ${
                veiculo.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                veiculo.status === 'reservado' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {veiculo.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Informações Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Ano</div>
              <div className="text-lg font-semibold">{veiculo.ano_modelo}/{veiculo.ano_fabricacao}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Quilometragem</div>
              <div className="text-lg font-semibold">{veiculo.quilometragem.toLocaleString('pt-BR')} km</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Combustível</div>
              <div className="text-lg font-semibold">{veiculo.combustivel}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Câmbio</div>
              <div className="text-lg font-semibold">{veiculo.cambio}</div>
            </div>
          </div>

          {/* Detalhes */}
          <div className="border-t pt-6 space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Características</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Cor:</span>
                  <span className="font-medium">{veiculo.cor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Estado:</span>
                  <span className="font-medium">{veiculo.estado}</span>
                </div>
                {veiculo.tipo_veiculo === 'Moto' && veiculo.cilindradas && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Cilindradas:</span>
                    <span className="font-medium">{veiculo.cilindradas}</span>
                  </div>
                )}
                {veiculo.final_placa !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Final Placa:</span>
                    <span className="font-medium">{veiculo.final_placa}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Condições</h3>
              <div className="flex flex-wrap gap-2">
                {veiculo.unico_dono && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    Único Dono
                  </span>
                )}
                {veiculo.ipva_pago && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    IPVA Pago
                  </span>
                )}
                {veiculo.licenciado && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    Licenciado
                  </span>
                )}
                {veiculo.aceita_troca && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    Aceita Troca
                  </span>
                )}
                {veiculo.tem_garantia_fabrica && (
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                    Garantia até {new Date(veiculo.validade_garantia).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>

            {veiculo.opcionais && veiculo.opcionais.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Opcionais</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {veiculo.opcionais.map((opcional, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{opcional}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {veiculo.outros_opcionais && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Outros Opcionais</h3>
                <p className="text-gray-700">{veiculo.outros_opcionais}</p>
              </div>
            )}

            {veiculo.tem_historico_manutencao && veiculo.detalhes_manutencao && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Histórico de Manutenção</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{veiculo.detalhes_manutencao}</p>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="border-t mt-8 pt-6 flex gap-4 flex-wrap">
            {veiculo.status === 'disponivel' && (
              <>
                <button
                  onClick={() => atualizarStatus('reservado')}
                  className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition"
                >
                  Marcar como Reservado
                </button>
                <button
                  onClick={() => atualizarStatus('vendido')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
                >
                  Marcar como Vendido
                </button>
              </>
            )}

            {veiculo.status === 'reservado' && (
              <>
                <button
                  onClick={() => atualizarStatus('disponivel')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Marcar como Disponível
                </button>
                <button
                  onClick={() => atualizarStatus('vendido')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
                >
                  Marcar como Vendido
                </button>
              </>
            )}

            {veiculo.status === 'vendido' && (
              <button
                onClick={() => atualizarStatus('disponivel')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Marcar como Disponível
              </button>
            )}

            <button
              onClick={deletarVeiculo}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition ml-auto"
            >
              Deletar Veículo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
