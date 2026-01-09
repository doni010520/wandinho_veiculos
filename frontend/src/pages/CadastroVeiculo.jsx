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
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  // Adiciona pontos a cada 3 dígitos
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Função para formatar preço
const formatMoney = (value) => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  // Converte para número e divide por 100 para ter centavos
  const amount = parseFloat(numbers) / 100;
  // Formata como moeda brasileira
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função para remover formatação e pegar valor numérico
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
    quilometragem_display: '', // Para exibição formatada
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
    preco_display: '', // Para exibição formatada
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

  // Handler especial para quilometragem
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

  // Handler especial para preço
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
    
    // Criar previews
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
      
      // Simular progresso - Etapa 1: Preparando dados (20%)
      setUploadProgress(20);
      
      // Adicionar dados do veículo
      Object.keys(formData).forEach(key => {
        if (key === 'opcionais') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (key === 'cor') {
          const corFinal = formData.cor === 'Outro' ? formData.cor_outro : formData.cor;
          submitData.append(key, corFinal);
        } else if (key === 'quilometragem') {
          // Enviar valor sem formatação
          submitData.append(key, formData.quilometragem);
        } else if (key === 'preco') {
          // Enviar valor em centavos sem formatação
          submitData.append(key, (parseInt(formData.preco) / 100).toFixed(2));
        } else if (!['cor_outro', 'tem_outros_opcionais', 'quilometragem_display', 'preco_display'].includes(key)) {
          submitData.append(key, formData[key]);
        }
      });

      // Simular progresso - Etapa 2: Adicionando fotos (40%)
      setUploadProgress(40);

      // Adicionar fotos
      fotos.forEach((foto, index) => {
        submitData.append('fotos', foto);
      });

      // Simular progresso - Etapa 3: Enviando (60%)
      setUploadProgress(60);

      await api.post('/veiculos', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          // Progresso real do upload (60% a 100%)
          const percentCompleted = Math.round((progressEvent.loaded * 40) / progressEvent.total) + 60;
          setUploadProgress(percentCompleted);
        }
      });

      setUploadProgress(100);
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
      setUploadProgress(0);
      
    } catch (error) {
      console.error('Erro ao cadastrar veículo:', error);
      alert('Erro ao cadastrar veículo: ' + (error.response?.data?.error || error.message));
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Cadastrar Veículo</h1>
        
        {/* Barra de Progresso */}
        {loading && (
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Cadastrando veículo...</span>
              <span className="text-sm font-medium text-blue-700">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {uploadProgress < 20 && 'Preparando dados...'}
              {uploadProgress >= 20 && uploadProgress < 40 && 'Processando fotos...'}
              {uploadProgress >= 40 && uploadProgress < 60 && 'Criando pasta no Drive...'}
              {uploadProgress >= 60 && uploadProgress < 100 && 'Fazendo upload das fotos...'}
              {uploadProgress === 100 && 'Concluído!'}
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Tipo de Veículo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Veículo *
            </label>
            <select
              name="tipo_veiculo"
              value={formData.tipo_veiculo}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="Carro">Carro</option>
              <option value="Picape">Picape</option>
              <option value="Moto">Moto</option>
              <option value="Van/Utilitário">Van/Utilitário</option>
            </select>
          </div>

          {/* Cilindradas (apenas para motos) */}
          {formData.tipo_veiculo === 'Moto' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          )}

          {/* Identificação */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Identificação</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marca *</label>
                <input
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modelo *</label>
                <input
                  type="text"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Versão</label>
                <input
                  type="text"
                  name="versao"
                  value={formData.versao}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ano Modelo *</label>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ano Fabricação *</label>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Final da Placa</label>
                <select
                  name="final_placa"
                  value={formData.final_placa}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Selecione</option>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Características Técnicas */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Características Técnicas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quilometragem *</label>
                <input
                  type="text"
                  value={formData.quilometragem_display}
                  onChange={handleKmChange}
                  required
                  disabled={loading}
                  placeholder="Ex: 120.000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.quilometragem_display} km</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Combustível *</label>
                <select
                  name="combustivel"
                  value={formData.combustivel}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="Flex">Flex</option>
                  <option value="Gasolina">Gasolina</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Elétrico">Elétrico</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Câmbio *</label>
                <select
                  name="cambio"
                  value={formData.cambio}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="Manual">Manual</option>
                  <option value="Automático">Automático</option>
                  <option value="Automatizado">Automatizado</option>
                  <option value="CVT">CVT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor *</label>
                <select
                  name="cor"
                  value={formData.cor}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="Branco">Branco</option>
                  <option value="Preto">Preto</option>
                  <option value="Prata">Prata</option>
                  <option value="Cinza">Cinza</option>
                  <option value="Vermelho">Vermelho</option>
                  <option value="Azul">Azul</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {formData.cor === 'Outro' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Especifique a Cor *</label>
                  <input
                    type="text"
                    name="cor_outro"
                    value={formData.cor_outro}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Condição */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Condição</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="Novo">Novo</option>
                  <option value="Semi-novo">Semi-novo</option>
                  <option value="Usado">Usado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Único Dono? *</label>
                <select
                  name="unico_dono"
                  value={formData.unico_dono}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IPVA Pago? *</label>
                <select
                  name="ipva_pago"
                  value={formData.ipva_pago}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Licenciado? *</label>
                <select
                  name="licenciado"
                  value={formData.licenciado}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </div>
            </div>
          </div>

          {/* Opcionais */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Opcionais</h2>
            
            <div className="space-y-3 mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="tem_garantia_fabrica"
                  checked={formData.tem_garantia_fabrica}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:bg-gray-100"
                />
                <span className="ml-2 text-gray-700">Tem Garantia de Fábrica</span>
              </label>

              {formData.tem_garantia_fabrica && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validade da Garantia *
                  </label>
                  <input
                    type="date"
                    name="validade_garantia"
                    value={formData.validade_garantia}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:bg-gray-100"
                />
                <span className="ml-2 text-gray-700">Tem Histórico de Manutenção</span>
              </label>

              {formData.tem_historico_manutencao && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detalhes da Manutenção *
                  </label>
                  <textarea
                    name="detalhes_manutencao"
                    value={formData.detalhes_manutencao}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Comercial */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Comercial</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preço *</label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-gray-600 font-medium">R$</span>
                  <input
                    type="text"
                    value={formData.preco_display}
                    onChange={handlePrecoChange}
                    required
                    disabled={loading}
                    placeholder="0,00"
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">R$ {formData.preco_display}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aceita Troca? *</label>
                <select
                  name="aceita_troca"
                  value={formData.aceita_troca}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
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
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    <span className="ml-2 text-gray-700">{opcional}</span>
                  </label>
                ))}

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="tem_outros_opcionais"
                    checked={formData.tem_outros_opcionais}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <span className="ml-2 text-gray-700">Outros</span>
                </label>

                {formData.tem_outros_opcionais && (
                  <div className="ml-6">
                    <textarea
                      name="outros_opcionais"
                      value={formData.outros_opcionais}
                      onChange={handleChange}
                      placeholder="Descreva outros opcionais..."
                      disabled={loading}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fotos */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Fotos * (mínimo 3, máximo 15)
            </h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div>
                  <label className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-block">
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
                </div>

                <div>
                  <label className="cursor-pointer bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition inline-block">
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
              </div>

              {previewFotos.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {previewFotos.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removerFoto(index)}
                        disabled={loading}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 disabled:bg-gray-400"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-600">
                {fotos.length} foto(s) adicionada(s)
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="border-t pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Veículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
