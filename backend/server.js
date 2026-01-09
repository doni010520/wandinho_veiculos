import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import supabase from './supabase.js';
import googleDrive from './googleDrive.js';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());


// Health checks
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend Veículo Manager rodando',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', express.json(), async (req, res) => {
  try {
    const { data, error } = await supabase.from('veiculos').select('count').limit(1);
    if (error) throw error;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Criar veículo
app.post('/api/veiculos', upload.array('fotos', 15), async (req, res) => {
  try {
    const {
      tipo_veiculo,
      cilindradas,
      marca,
      modelo,
      versao,
      ano_modelo,
      ano_fabricacao,
      final_placa,
      quilometragem,
      combustivel,
      cambio,
      cor,
      estado,
      unico_dono,
      ipva_pago,
      licenciado,
      aceita_troca,
      tem_garantia_fabrica,
      validade_garantia,
      tem_historico_manutencao,
      detalhes_manutencao,
      preco,
      opcionais,
      outros_opcionais,
      user_id
    } = req.body;

    // Criar pasta no Google Drive
    const folderId = await googleDrive.createVehicleFolder(
      tipo_veiculo,
      marca,
      modelo,
      versao,
      ano_modelo
    );

    // Inserir veículo no Supabase
    const { data: veiculo, error: veiculoError } = await supabase
      .from('veiculos')
      .insert({
        tipo_veiculo,
        cilindradas,
        google_drive_folder_id: folderId,
        marca,
        modelo,
        versao,
        ano_modelo,
        ano_fabricacao,
        final_placa,
        quilometragem,
        combustivel,
        cambio,
        cor,
        estado,
        unico_dono: unico_dono === 'true',
        ipva_pago: ipva_pago === 'true',
        licenciado: licenciado === 'true',
        aceita_troca: aceita_troca === 'true',
        tem_garantia_fabrica: tem_garantia_fabrica === 'true',
        validade_garantia: validade_garantia || null,
        tem_historico_manutencao: tem_historico_manutencao === 'true',
        detalhes_manutencao: detalhes_manutencao || null,
        preco,
        opcionais: opcionais ? JSON.parse(opcionais) : [],
        outros_opcionais: outros_opcionais || null,
        user_id: user_id || null
      })
      .select()
      .single();

    if (veiculoError) throw veiculoError;

    const veiculoId = veiculo.id;

    // Upload das fotos
    if (req.files && req.files.length > 0) {
      const fotosData = [];
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const photoUrl = await googleDrive.uploadPhoto(folderId, file, i);
        
        fotosData.push({
          veiculo_id: veiculoId,
          url_foto: photoUrl,
          ordem: i
        });
      }

      const { error: fotosError } = await supabase
        .from('veiculo_fotos')
        .insert(fotosData);

      if (fotosError) throw fotosError;
    }

    res.json({
      success: true,
      veiculo
    });

  } catch (error) {
    console.error('Erro ao criar veículo:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Listar veículos
app.get('/api/veiculos', async (req, res) => {
  try {
    const { data: veiculos, error: veiculosError } = await supabase
      .from('veiculos')
      .select(`
        *,
        veiculo_fotos (
          id,
          url_foto,
          ordem
        )
      `)
      .eq('status', 'disponivel')
      .order('created_at', { ascending: false });

    if (veiculosError) throw veiculosError;

    // Formatar fotos para manter compatibilidade
    const veiculosFormatados = veiculos.map(veiculo => ({
      ...veiculo,
      fotos: veiculo.veiculo_fotos
        .sort((a, b) => a.ordem - b.ordem)
        .map(foto => ({
          id: foto.id,
          url: foto.url_foto,
          ordem: foto.ordem
        }))
    }));

    // Remove veiculo_fotos do objeto (mantém só fotos)
    veiculosFormatados.forEach(v => delete v.veiculo_fotos);

    res.json(veiculosFormatados);
  } catch (error) {
    console.error('Erro ao listar veículos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar veículo por ID
app.get('/api/veiculos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: veiculo, error: veiculoError } = await supabase
      .from('veiculos')
      .select(`
        *,
        veiculo_fotos (
          id,
          url_foto,
          ordem
        )
      `)
      .eq('id', id)
      .single();

    if (veiculoError) {
      if (veiculoError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Veículo não encontrado' });
      }
      throw veiculoError;
    }

    // Formatar fotos
    const veiculoFormatado = {
      ...veiculo,
      fotos: veiculo.veiculo_fotos
        .sort((a, b) => a.ordem - b.ordem)
        .map(foto => ({
          id: foto.id,
          url: foto.url_foto,
          ordem: foto.ordem
        }))
    };

    delete veiculoFormatado.veiculo_fotos;

    res.json(veiculoFormatado);
  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar status do veículo
app.patch('/api/veiculos/:id/status', express.json(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('veiculos')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Veículo não encontrado' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deletar veículo
app.delete('/api/veiculos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('veiculos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar veículo:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

// Teste de conexão com Supabase
supabase.from('veiculos').select('count').limit(1)
  .then(() => console.log('✅ Supabase conectado'))
  .catch(err => console.error('❌ Erro ao conectar no Supabase:', err.message));

// Importante: bind em 0.0.0.0 para funcionar no Easypanel
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});
