import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env.local') });

let privateKey = process.env.FIREBASE_PRIVATE_KEY;
console.log('Original Length:', privateKey ? privateKey.length : 'null');

if (privateKey) {
    privateKey = privateKey.trim();
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');
}

console.log('Processed Start:', privateKey?.substring(0, 30));
console.log('Processed End:', privateKey?.substring(privateKey.length - 30));
console.log('Has newlines:', privateKey?.includes('\n'));
console.log('Processed Length:', privateKey?.length);

if (privateKey && !privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    console.log('ERROR: Key does not start with correct header');
}
if (privateKey && !privateKey.endsWith('-----END PRIVATE KEY-----\n') && !privateKey.endsWith('-----END PRIVATE KEY-----')) {
    console.log('ERROR: Key does not end with correct footer');
}
