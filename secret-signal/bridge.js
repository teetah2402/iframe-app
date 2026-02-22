//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\public\apps-cloud\secret-signal\bridge.js total lines 74 
//#1. Dynamic Component Discovery (DCD): Hub wajib melakukan scanning file secara otomatis.
//#2. Lazy Loading: Modul hanya di-import ke RAM saat dipanggil (On-Demand).
//#3. Atomic Isolation: 1 File = 1 Fungsi dengan nama file yang identik dengan nama fungsi aslinya.
//#4. Zero Logic Mutation: Dilarang merubah alur logika, nama variabel, atau struktur if/try/loop.
//#######################################################################

/* FLOWORK BRIDGE SERVER
   Lokasi: C:\FLOWORK\flowork-gui\template\web\bridge.js

   Cara Pakai:
   1. Pastikan file yt-dlp.exe ada di folder C:\FLOWORK\flowork-gui\template\web\
   2. Buka Terminal di folder C:\FLOWORK\flowork-gui\template\web\
   3. npm install express cors
   4. node bridge.js
*/

import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const TEMP_DIR = path.join(__dirname, 'temp_audio');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

app.post('/hack-stream', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Link kosong bro!" });

    console.log(`[BRIDGE] Memproses Link: ${url}`);

    const fileId = Date.now();
    const outputTemplate = path.join(TEMP_DIR, `audio_${fileId}.%(ext)s`);
    const finalFile = path.join(TEMP_DIR, `audio_${fileId}.wav`);

    const cmd = `yt-dlp -x --audio-format wav -o "${outputTemplate}" "${url}"`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`[ERROR] Gagal Download: ${stderr}`);
            return res.status(500).json({ error: "Gagal download stream." });
        }

        console.log(`[SUCCESS] Audio siap.`);

        if (fs.existsSync(finalFile)) {
            res.download(finalFile, 'stream.wav', (err) => {
                if (!err) {
                    try { fs.unlinkSync(finalFile); } catch(e){}
                    console.log(`[CLEAN] File temp dihapus.`);
                }
            });
        } else {
            res.status(500).json({ error: "File audio tidak ditemukan." });
        }
    });
});

app.listen(PORT, () => {
    console.log("========================================");
    console.log(`   FLOWORK BRIDGE SERVER: ONLINE (PORT 3000)`);
    console.log(`   SIAP JEBOL LINK TIKTOK & YOUTUBE...`);
    console.log("========================================");
});
