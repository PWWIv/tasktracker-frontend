import CryptoJS from 'crypto-js';

const clientKey = 'your-client-key'; // Замените на ваш ключ клиента

const encryptClientSide = (password) => {
    const clientKey = getClientKey();
    return CryptoJS.AES.encrypt(password, clientKey).toString();
};

const decryptClientSide = (encryptedPassword) => {
    const clientKey = getClientKey();
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, clientKey);
    return bytes.toString(CryptoJS.enc.Utf8);
};

export { encryptClientSide, decryptClientSide };
