# 📁 ESTRUTURA COMPLETA DO PROJETO

```
veiculo-manager/
│
├── backend/
│   ├── package.json
│   ├── db.js
│   ├── googleDrive.js
│   ├── server.js
│   └── .env.example
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── .env.example
│   └── src/
│       ├── index.css
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       ├── components/     (pasta vazia)
│       └── pages/
│           ├── CadastroVeiculo.jsx
│           ├── ListaVeiculos.jsx
│           └── DetalhesVeiculo.jsx
│
├── .gitignore
└── README.md
```

## 📝 INSTRUÇÕES PARA SUBIR NO GITHUB

1. Crie um repositório no GitHub
2. Clone ou faça download de todos os arquivos
3. Organize na estrutura acima
4. Suba para o GitHub:
   ```bash
   git init
   git add .
   git commit -m "Projeto inicial - Gerenciador de Veículos"
   git remote add origin [URL_DO_SEU_REPO]
   git push -u origin main
   ```

## ⚙️ CONFIGURAÇÃO NO EASYPANEL

### Backend
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Port**: 3000

### Frontend
- **Build Command**: `npm install && npm run build`
- **Start Command**: (deixar vazio)
- **Output Directory**: `dist`

### Variáveis de Ambiente (Backend)
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `GOOGLE_SERVICE_ACCOUNT` (JSON completo)
- `GOOGLE_DRIVE_FOLDER_CARRO`
- `GOOGLE_DRIVE_FOLDER_PICAPE`
- `GOOGLE_DRIVE_FOLDER_MOTO`
- `GOOGLE_DRIVE_FOLDER_VAN`

### Variáveis de Ambiente (Frontend)
- `VITE_API_URL` (URL do backend, ex: https://api.seudominio.com/api)
