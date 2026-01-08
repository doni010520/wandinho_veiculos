# Gerenciador de Veículos

## Configuração Google Drive

1. Crie 4 pastas no Google Drive:
   - Carro
   - Picape
   - Moto
   - Van/Utilitário

2. Copie o ID de cada pasta (último trecho da URL)
   - Exemplo: `https://drive.google.com/drive/folders/1abc123def456` → ID é `1abc123def456`

3. Configure as variáveis de ambiente no Easypanel:
   - `GOOGLE_DRIVE_FOLDER_CARRO=ID_da_pasta_Carro`
   - `GOOGLE_DRIVE_FOLDER_PICAPE=ID_da_pasta_Picape`
   - `GOOGLE_DRIVE_FOLDER_MOTO=ID_da_pasta_Moto`
   - `GOOGLE_DRIVE_FOLDER_VAN=ID_da_pasta_Van`

4. Service Account:
   - Crie no Google Cloud Console
   - Ative a Google Drive API
   - Compartilhe as 4 pastas com o email da service account
   - Cole o JSON completo em `GOOGLE_SERVICE_ACCOUNT`

## Deploy Easypanel

### Backend
- Build Command: `npm install`
- Start Command: `npm start`
- Port: 3000

### Frontend
- Build Command: `npm install && npm run build`
- Start Command: (deixar vazio, usa build estática)
- Output Directory: `dist`

## Variáveis de Ambiente

Veja `.env.example` em cada pasta (backend e frontend)
