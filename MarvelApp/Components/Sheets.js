const updateSheetData = async (sheetName, range, values, token) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheetName)}!${range}?valueInputOption=RAW`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ values }),
  });

  return res.json();
};
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'], // permiso de lectura/escritura
  webClientId: 'TU_WEB_CLIENT_ID.apps.googleusercontent.com', // de Google Cloud
});

const loginWithGoogle = async () => {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  const token = (await GoogleSignin.getTokens()).accessToken;
  return token;
};
