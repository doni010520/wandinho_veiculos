import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const opcionaisDisponiveis = [
  'Ar-condicionado',
  'Direção hidráulica/elétrica',
  'Vidros elétricos',
  'Trava elétrica',
  'Airbag',
  'ABS',
  'Multimídia',
  'Sensor de estacionamento',
  'Câmera de ré',
  'Bancos de couro',
  'Teto solar'
];

// Função para formatar quilometragem
const formatKm = (value) => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Função para formatar preço
const formatMoney = (value) => {
  const numbers = value.replace(/\D/g, '');
  const amount = parseFloat(numbers) / 100;
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função para remover formatação
const unformatNumber = (value) => {
  return value.replace(/\D/g, '');
};

export default function CadastroVeiculo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fotos, setFotos] = useState([]);
  const [previewFotos, setPreviewFotos] = useState([]);
  const [formData, setFormData] = useState({
    tipo_veiculo: 'Carro',
    cilindradas: '',
    marca: '',
    modelo: '',
    versao: '',
    ano_modelo: '',
    ano_fabricacao: '',
    final_placa: '',
    quilometragem: '',
    quilometragem_display: '',
    combustivel: 'Flex',
    cambio: 'Manual',
    cor: 'Branco',
    cor_outro: '',
    estado: 'Usado',
    unico_dono: 'false',
    ipva_pago: 'false',
    licenciado: 'false',
    aceita_troca: 'false',
    tem_garantia_fabrica: false,
    validade_garantia: '',
    tem_historico_manutencao: false,
    detalhes_manutencao: '',
    preco: '',
    preco_display: '',
    opcionais: [],
    tem_outros_opcionais: false,
    outros_opcionais: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleKmChange = (e) => {
    const value = e.target.value;
    const unformatted = unformatNumber(value);
    const formatted = formatKm(value);
    
    setFormData(prev => ({
      ...prev,
      quilometragem: unformatted,
      quilometragem_display: formatted
    }));
  };

  const handlePrecoChange = (e) => {
    const value = e.target.value;
    const unformatted = unformatNumber(value);
    const formatted = formatMoney(value);
    
    setFormData(prev => ({
      ...prev,
      preco: unformatted,
      preco_display: formatted
    }));
  };

  const handleOpcionaisChange = (opcional) => {
    setFormData(prev => {
      const opcionais = prev.opcionais.includes(opcional)
        ? prev.opcionais.filter(o => o !== opcional)
        : [...prev.opcionais, opcional];
      return { ...prev, opcionais };
    });
  };

  const handleFotosChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (fotos.length + files.length > 15) {
      alert('Máximo de 15 fotos permitidas');
      return;
    }

    setFotos(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewFotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCameraCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (fotos.length >= 15) {
      alert('Máximo de 15 fotos permitidas');
      return;
    }

    setFotos(prev => [...prev, file]);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewFotos(prev => [...prev, reader.result]);
    };
    reader.readAsDataURL(file);
  };

  const removerFoto = (index) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
    setPreviewFotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (fotos.length < 3) {
      alert('Mínimo de 3 fotos obrigatório');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const submitData = new FormData();
      
      // Etapa 1: Preparando dados (10%)
      setUploadProgress(10);
      
      Object.keys(formData).forEach(key => {
        if (key === 'opcionais') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (key === 'cor') {
          const corFinal = formData.cor === 'Outro' ? formData.cor_outro : formData.cor;
          submitData.append(key, corFinal);
        } else if (key === 'quilometragem') {
          submitData.append(key, formData.quilometragem);
        } else if (key === 'preco') {
          submitData.append(key, (parseInt(formData.preco) / 100).toFixed(2));
        } else if (!['cor_outro', 'tem_outros_opcionais', 'quilometragem_display', 'preco_display'].includes(key)) {
          submitData.append(key, formData[key]);
        }
      });

      // Etapa 2: Adicionando fotos (20%)
      setUploadProgress(20);

      fotos.forEach((foto, index) => {
        submitData.append('fotos', foto);
      });

      // Etapa 3: Enviando para servidor (20% -> 70%)
      await api.post('/veiculos', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          // Upload HTTP vai de 20% a 70%
          const percentCompleted = Math.round((progressEvent.loaded * 50) / progressEvent.total) + 20;
          setUploadProgress(percentCompleted);
        }
      });

      // Etapa 4: Processando no backend (85%)
      setUploadProgress(85);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Etapa 5: Finalizando (95%)
      setUploadProgress(95);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Etapa 6: Concluído! (100%)
      setUploadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fechar modal ANTES do alert
      setLoading(false);
      setUploadProgress(0);
      
      alert('Veículo cadastrado com sucesso!');
      
      // Limpar formulário
      setFormData({
        tipo_veiculo: 'Carro',
        cilindradas: '',
        marca: '',
        modelo: '',
        versao: '',
        ano_modelo: '',
        ano_fabricacao: '',
        final_placa: '',
        quilometragem: '',
        quilometragem_display: '',
        combustivel: 'Flex',
        cambio: 'Manual',
        cor: 'Branco',
        cor_outro: '',
        estado: 'Usado',
        unico_dono: 'false',
        ipva_pago: 'false',
        licenciado: 'false',
        aceita_troca: 'false',
        tem_garantia_fabrica: false,
        validade_garantia: '',
        tem_historico_manutencao: false,
        detalhes_manutencao: '',
        preco: '',
        preco_display: '',
        opcionais: [],
        tem_outros_opcionais: false,
        outros_opcionais: ''
      });
      setFotos([]);
      setPreviewFotos([]);
      
    } catch (error) {
      console.error('Erro ao cadastrar veículo:', error);
      
      // Fechar modal antes de mostrar erro
      setLoading(false);
      setUploadProgress(0);
      
      alert('Erro ao cadastrar veículo: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Glass Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl p-8">
          <h1 className="text-3xl font-bold mb-8 text-white">Cadastrar Veículo</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Tipo de Veículo */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Tipo de Veículo *
              </label>
              <select
                name="tipo_veiculo"
                value={formData.tipo_veiculo}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
              >
                <option value="Carro" className="bg-gray-800">Carro</option>
                <option value="Picape" className="bg-gray-800">Picape</option>
                <option value="Moto" className="bg-gray-800">Moto</option>
                <option value="Van/Utilitário" className="bg-gray-800">Van/Utilitário</option>
              </select>
            </div>

            {/* Cilindradas */}
            {formData.tipo_veiculo === 'Moto' && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Cilindradas *
                </label>
                <input
                  type="text"
                  name="cilindradas"
                  value={formData.cilindradas}
                  onChange={handleChange}
                  placeholder="Ex: 125cc, 300cc"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                />
              </div>
            )}

            {/* Identificação */}
            <div className="border-t border-white/10 pt-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Identificação</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Marca *</label>
                  <input
                    type="text"
                    name="marca"
                    value={formData.marca}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Modelo *</label>
                  <input
                    type="text"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Versão</label>
                  <input
                    type="text"
                    name="versao"
                    value={formData.versao}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Ano Modelo *</label>
                  <input
                    type="number"
                    name="ano_modelo"
                    value={formData.ano_modelo}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    placeholder="Ex: 2024"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Ano Fabricação *</label>
                  <input
                    type="number"
                    name="ano_fabricacao"
                    value={formData.ano_fabricacao}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder="Ex: 2024"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Final da Placa</label>
                  <select
                    name="final_placa"
                    value={formData.final_placa}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                  >
                    <option value="" className="bg-gray-800">Selecione</option>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <option key={num} value={num} className="bg-gray-800">{num}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Características Técnicas */}
            <div className="border-t border-white/10 pt-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Características Técnicas</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Quilometragem *</label>
                  <input
                    type="text"
                    value={formData.quilometragem_display}
                    onChange={handleKmChange}
                    required
                    disabled={loading}
                    placeholder="Ex: 120.000"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                  />
                  <p className="text-xs text-blue-300 mt-1">{formData.quilometragem_display} km</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Combustível *</label>
                  <select
                    name="combustivel"
                    value={formData.combustivel}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                  >
                    <option value="Flex" className="bg-gray-800">Flex</option>
                    <option value="Gasolina" className="bg-gray-800">Gasolina</option>
                    <option value="Diesel" className="bg-gray-800">Diesel</option>
                    <option value="Elétrico" className="bg-gray-800">Elétrico</option>
                    <option value="Híbrido" className="bg-gray-800">Híbrido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Câmbio *</label>
                  <select
                    name="cambio"
                    value={formData.cambio}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                  >
                    <option value="Manual" className="bg-gray-800">Manual</option>
                    <option value="Automático" className="bg-gray-800">Automático</option>
                    <option value="Automatizado" className="bg-gray-800">Automatizado</option>
                    <option value="CVT" className="bg-gray-800">CVT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Cor *</label>
                  <select
                    name="cor"
                    value={formData.cor}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                  >
                    <option value="Branco" className="bg-gray-800">Branco</option>
                    <option value="Preto" className="bg-gray-800">Preto</option>
                    <option value="Prata" className="bg-gray-800">Prata</option>
                    <option value="Cinza" className="bg-gray-800">Cinza</option>
                    <option value="Vermelho" className="bg-gray-800">Vermelho</option>
                    <option value="Azul" className="bg-gray-800">Azul</option>
                    <option value="Outro" className="bg-gray-800">Outro</option>
                  </select>
                </div>

                {formData.cor === 'Outro' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Especifique a Cor *</label>
                    <input
                      type="text"
                      name="cor_outro"
                      value={formData.cor_outro}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Condição */}
            <div className="border-t border-white/10 pt-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Condição</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Estado *</label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                  >
                    <option value="Novo" className="bg-gray-800">Novo</option>
                    <option value="Semi-novo" className="bg-gray-800">Semi-novo</option>
                    <option value="Usado" className="bg-gray-800">Usado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Único Dono? *</label>
                  <select
                    name="unico_dono"
                    value={formData.unico_dono}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                  >
                    <option value="true" className="bg-gray-800">Sim</option>
                    <option value="false" className="bg-gray-800">Não</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">IPVA Pago? *</label>
                  <select
                    name="ipva_pago"
                    value={formData.ipva_pago}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                  >
                    <option value="true" className="bg-gray-800">Sim</option>
                    <option value="false" className="bg-gray-800">Não</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Licenciado? *</label>
                  <select
                    name="licenciado"
                    value={formData.licenciado}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                  >
                    <option value="true" className="bg-gray-800">Sim</option>
                    <option value="false" className="bg-gray-800">Não</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Opcionais */}
            <div className="border-t border-white/10 pt-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Opcionais</h2>
              
              <div className="space-y-3 mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="tem_garantia_fabrica"
                    checked={formData.tem_garantia_fabrica}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-5 h-5 text-blue-500 bg-white/5 border-white/20 focus:ring-blue-400 focus:ring-offset-0"
                  />
                  <span className="ml-3 text-gray-200">Tem Garantia de Fábrica</span>
                </label>

                {formData.tem_garantia_fabrica && (
                  <div className="ml-8">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Validade da Garantia *
                    </label>
                    <input
                      type="date"
                      name="validade_garantia"
                      value={formData.validade_garantia}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                    />
                  </div>
                )}

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="tem_historico_manutencao"
                    checked={formData.tem_historico_manutencao}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-5 h-5 text-blue-500 bg-white/5 border-white/20 focus:ring-blue-400 focus:ring-offset-0"
                  />
                  <span className="ml-3 text-gray-200">Tem Histórico de Manutenção</span>
                </label>

                {formData.tem_historico_manutencao && (
                  <div className="ml-8">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Detalhes da Manutenção *
                    </label>
                    <textarea
                      name="detalhes_manutencao"
                      value={formData.detalhes_manutencao}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Comercial */}
            <div className="border-t border-white/10 pt-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Comercial</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Preço *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-300 font-medium">R$</span>
                    <input
                      type="text"
                      value={formData.preco_display}
                      onChange={handlePrecoChange}
                      required
                      disabled={loading}
                      placeholder="0,00"
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                    />
                  </div>
                  <p className="text-xs text-blue-300 mt-1">R$ {formData.preco_display}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Aceita Troca? *</label>
                  <select
                    name="aceita_troca"
                    value={formData.aceita_troca}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                  >
                    <option value="true" className="bg-gray-800">Sim</option>
                    <option value="false" className="bg-gray-800">Não</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">
                  Opcionais/Acessórios
                </label>
                <div className="space-y-2">
                  {opcionaisDisponiveis.map(opcional => (
                    <label key={opcional} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.opcionais.includes(opcional)}
                        onChange={() => handleOpcionaisChange(opcional)}
                        disabled={loading}
                        className="w-5 h-5 text-blue-500 bg-white/5 border-white/20 focus:ring-blue-400 focus:ring-offset-0"
                      />
                      <span className="ml-3 text-gray-200">{opcional}</span>
                    </label>
                  ))}

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="tem_outros_opcionais"
                      checked={formData.tem_outros_opcionais}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-5 h-5 text-blue-500 bg-white/5 border-white/20 focus:ring-blue-400 focus:ring-offset-0"
                    />
                    <span className="ml-3 text-gray-200">Outros</span>
                  </label>

                  {formData.tem_outros_opcionais && (
                    <div className="ml-8">
                      <textarea
                        name="outros_opcionais"
                        value={formData.outros_opcionais}
                        onChange={handleChange}
                        placeholder="Descreva outros opcionais..."
                        disabled={loading}
                        rows={2}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50 backdrop-blur-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fotos */}
            <div className="border-t border-white/10 pt-6">
              <h2 className="text-xl font-semibold mb-4 text-white">
                Fotos * (mínimo 3, máximo 15)
              </h2>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 transition inline-block font-medium">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFotosChange}
                      disabled={loading}
                      className="hidden"
                    />
                    📁 Upload de Fotos
                  </label>

                  <label className="cursor-pointer bg-green-600 hover:bg-green-500 text-white px-6 py-3 transition inline-block font-medium">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCameraCapture}
                      disabled={loading}
                      className="hidden"
                    />
                    📷 Abrir Câmera
                  </label>
                </div>

                {previewFotos.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {previewFotos.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover border-2 border-white/10"
                        />
                        <button
                          type="button"
                          onClick={() => removerFoto(index)}
                          disabled={loading}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white w-7 h-7 flex items-center justify-center transition disabled:opacity-50"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-300">
                  {fotos.length} foto(s) adicionada(s)
                </p>
              </div>
            </div>

            {/* Botão */}
            <div className="border-t border-white/10 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 transition disabled:bg-gray-600 disabled:cursor-not-allowed text-lg font-semibold"
              >
                {loading ? 'Cadastrando...' : 'Cadastrar Veículo'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Progresso - Centro da Tela */}
      {loading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-white/20 p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Cadastrando Veículo
            </h3>
            
            <div className="space-y-4">
              {/* Barra de Progresso */}
              <div className="relative h-6 bg-gray-700/50 overflow-hidden">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${uploadProgress}%` }}
                >
                  <span className="text-white text-xs font-bold">{uploadProgress}%</span>
                </div>
              </div>

              {/* Status */}
              <div className="text-center">
                <p className="text-blue-300 font-medium">
                  {uploadProgress < 20 && '📋 Preparando dados...'}
                  {uploadProgress >= 20 && uploadProgress < 70 && '☁️ Enviando para o servidor...'}
                  {uploadProgress >= 70 && uploadProgress < 85 && '📁 Criando pasta no Drive...'}
                  {uploadProgress >= 85 && uploadProgress < 95 && '🖼️ Fazendo upload das fotos...'}
                  {uploadProgress >= 95 && uploadProgress < 100 && '💾 Salvando no banco de dados...'}
                  {uploadProgress === 100 && '✅ Concluído!'}
                </p>
              </div>

              {/* Animação de Loading */}
              <div className="flex justify-center">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
