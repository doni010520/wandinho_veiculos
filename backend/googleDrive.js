import { google } from 'googleapis';

// IDs das pastas principais (você vai criar manualmente no Drive)
const PARENT_FOLDERS = {
  'Carro': process.env.GOOGLE_DRIVE_FOLDER_CARRO,
  'Picape': process.env.GOOGLE_DRIVE_FOLDER_PICAPE,
  'Moto': process.env.GOOGLE_DRIVE_FOLDER_MOTO,
  'Van/Utilitário': process.env.GOOGLE_DRIVE_FOLDER_VAN
};

class GoogleDriveService {
  constructor() {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    
    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  async createVehicleFolder(tipoVeiculo, marca, modelo, versao, ano) {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const folderName = `${marca} ${modelo} ${versao || ''} ${ano} ${timestamp}`.trim();
    
    const parentFolderId = PARENT_FOLDERS[tipoVeiculo];
    
    if (!parentFolderId) {
      throw new Error(`Parent folder ID not found for: ${tipoVeiculo}`);
    }

    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    };

    const folder = await this.drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    // Tornar a pasta pública
    await this.drive.permissions.create({
      fileId: folder.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    return folder.data.id;
  }

  async uploadPhoto(folderId, file, ordem) {
    const fileMetadata = {
      name: `foto_${ordem}.${file.originalname.split('.').pop()}`,
      parents: [folderId]
    };

    const media = {
      mimeType: file.mimetype,
      body: file.buffer
    };

    const uploadedFile = await this.drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink'
    });

    // Tornar a foto pública
    await this.drive.permissions.create({
      fileId: uploadedFile.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // Retornar URL direta da imagem
    const photoUrl = `https://drive.google.com/uc?export=view&id=${uploadedFile.data.id}`;
    
    return photoUrl;
  }

  async listFolderPhotos(folderId) {
    const response = await this.drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/'`,
      fields: 'files(id, name, webViewLink)',
      orderBy: 'name'
    });

    return response.data.files.map(file => ({
      id: file.id,
      name: file.name,
      url: `https://drive.google.com/uc?export=view&id=${file.id}`
    }));
  }
}

export default new GoogleDriveService();
