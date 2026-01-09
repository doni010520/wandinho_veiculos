import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import db from './db.js';
import googleDrive from './googleDrive.js';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Health checks
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend Veículo Manager rodando',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Criar veículo
app.post('/api/veiculos', upload.array('fotos', 15), async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');

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

    // Inserir veículo no banco
    const veiculoResult = await client.query(
      `INSERT INTO veiculos (
        tipo_veiculo, cilindradas, google_drive_folder_id, marca, modelo, versao,
        ano_modelo, ano_fabricacao, final_placa, quilometragem, combustivel,
        cambio, cor, estado, unico_dono, ipva_pago, licenciado, aceita_troca,
        tem_garantia_fabrica, validade_garantia, tem_historico_manutencao,
        detalhes_manutencao, preco, opcionais, outros_opcionais, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      RETURNING *`,
      [
        tipo_veiculo, cilindradas, folderId, marca, modelo, versao,
        ano_modelo, ano_fabricacao, final_placa, quilometragem, combustivel,
        cambio, cor, estado, unico_dono === 'true', ipva_pago === 'true',
        licenciado === 'true', aceita_troca === 'true',
        tem_garantia_fabrica === 'true', validade_garantia || null,
        tem_historico_manutencao === 'true', detalhes_manutencao || null,
        preco, opcionais ? JSON.parse(opcionais) : [], outros_opcionais || null,
        user_id || null
      ]
    );

    const veiculoId = veiculoResult.rows[0].id;

    // Upload das fotos
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const photoUrl = await googleDrive.uploadPhoto(folderId, file, i);

        await client.query(
          'INSERT INTO veiculo_fotos (veiculo_id, url_foto, ordem) VALUES ($1, $2, $3)',
          [veiculoId, photoUrl, i]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      veiculo: veiculoResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar veículo:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Listar veículos
app.get('/api/veiculos', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT v.*, 
        COALESCE(
          json_agg(
            json_build_object('id', f.id, 'url', f.url_foto, 'ordem', f.ordem)
            ORDER BY f.ordem
          ) FILTER (WHERE f.id IS NOT NULL),
          '[]'
        ) as fotos
      FROM veiculos v
      LEFT JOIN veiculo_fotos f ON v.id = f.veiculo_id
      WHERE v.status = 'disponivel'
      GROUP BY v.id
      ORDER BY v.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar veículos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar veículo por ID
app.get('/api/veiculos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT v.*, 
        COALESCE(
          json_agg(
            json_build_object('id', f.id, 'url', f.url_foto, 'ordem', f.ordem)
            ORDER BY f.ordem
          ) FILTER (WHERE f.id IS NOT NULL),
          '[]'
        ) as fotos
      FROM veiculos v
      LEFT JOIN veiculo_fotos f ON v.id = f.veiculo_id
      WHERE v.id = $1
      GROUP BY v.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar status do veículo
app.patch('/api/veiculos/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await db.query(
      'UPDATE veiculos SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deletar veículo
app.delete('/api/veiculos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM veiculos WHERE id = $1', [id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar veículo:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

// Teste de conexão com banco
db.query('SELECT NOW()')
  .then(() => console.log('✅ Banco de dados conectado'))
  .catch(err => console.error('❌ Erro ao conectar no banco:', err));

// Importante: bind em 0.0.0.0 para funcionar no Easypanel
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});
