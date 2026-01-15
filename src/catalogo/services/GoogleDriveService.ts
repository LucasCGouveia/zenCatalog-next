import { google } from 'googleapis';

export async function uploadToUserDrive(file: any, accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.create({
    requestBody: {
      name: file.name,
      mimeType: file.mimeType,
      parents: ['root'], // Você pode até criar uma pasta "ZenCatalog" automática
    },
    media: {
      mimeType: file.mimeType,
      body: file.stream, // Stream do arquivo
    },
    fields: 'id, webViewLink',
  });

  return response.data;
}