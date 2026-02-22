//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\public\apps-cloud\secret-signal\js\worker.js total lines 111 
//#1. Dynamic Component Discovery (DCD): Hub wajib melakukan scanning file secara otomatis.
//#2. Lazy Loading: Modul hanya di-import ke RAM saat dipanggil (On-Demand).
//#3. Atomic Isolation: 1 File = 1 Fungsi dengan nama file yang identik dengan nama fungsi aslinya.
//#4. Zero Logic Mutation: Dilarang merubah alur logika, nama variabel, atau struktur if/try/loop.
//#######################################################################

const workerLocation = self.location.href;
const CURRENT_DIR = workerLocation.substring(0, workerLocation.lastIndexOf('/') + 1);
const LIB_PATH = CURRENT_DIR + 'libs/';

if (typeof window === 'undefined') self.window = self;
if (typeof document === 'undefined') {
    self.document = {
        createElement: () => ({ src: '', type: '', appendChild: () => {} }),
        getElementsByTagName: () => [{ appendChild: () => {} }],
        head: { appendChild: () => {} },
        body: { appendChild: () => {} },
        currentScript: { src: LIB_PATH + 'ffmpeg.min.js' }
    };
}

try { importScripts(LIB_PATH + 'ffmpeg.min.js'); } catch (e) {}

let ffmpeg = null;

async function initFFmpeg() {
    if (ffmpeg) return;
    const { createFFmpeg } = FFmpeg;
    ffmpeg = createFFmpeg({ corePath: LIB_PATH + 'ffmpeg-core.js', log: true, mainName: 'main' });
    await ffmpeg.load();
}

self.onmessage = async (e) => {
    const { type, data } = e.data;
    if (type === 'INIT') { try { await initFFmpeg(); } catch(e){} }

    if (type === 'ENCODE') {
        try {
            const { videoFile, audioBuffer, visualAssets, outputFormat, aspectRatio } = data;
            if (!ffmpeg) await initFFmpeg();

            ffmpeg.FS('writeFile', 'signal.wav', new Uint8Array(audioBuffer));

            if (outputFormat === 'wav') {
                const d = ffmpeg.FS('readFile', 'signal.wav');
                self.postMessage({ type: 'DONE', buffer: d.buffer, fileType: 'audio/wav', fileName: 'signal.wav' }, [d.buffer]);
                return;
            }

            let args = [];
            let outName = 'output.mp4';

            if (videoFile) {
                ffmpeg.FS('writeFile', 'input.mp4', new Uint8Array(videoFile));
                args = [
                    '-stream_loop', '-1',
                    '-i', 'input.mp4',
                    '-i', 'signal.wav', // Audio FSK
                    '-map', '0:v',
                    '-map', '1:a', // Pake audio FSK kita
                    '-c:v', 'copy',
                    '-c:a', 'aac',
                    '-shortest',
                    outName
                ];
            } else if (visualAssets) {
                ffmpeg.FS('writeFile', 'lock.png', new Uint8Array(visualAssets.logo));
                ffmpeg.FS('writeFile', 'text.png', new Uint8Array(visualAssets.text));

                let w = 1280, h = 720;
                let lockScale = 0.5;
                if (aspectRatio === '9:16') { w = 720; h = 1280; lockScale = 0.6; }

                const filterComplex = `
                    [2:a]showwaves=s=${w}x${h}:mode=line:colors=cyan@0.5[waves];
                    [0:v]scale=${w}:${h}[bg];
                    [bg][waves]overlay=format=auto[layer1];
                    [1:v]format=rgba,scale=iw*${lockScale}:-1[lock];
                    [layer1][lock]overlay=x=(W-w)/2:y=(H-h)/2[layer2];
                    [3:v]format=rgba[txt];
                    [layer2][txt]overlay=x=(W-w)/2:y=(H-h)/2+180[outv]
                `;

                args = [
                    '-f', 'lavfi', '-i', `color=c=black:s=${w}x${h}:r=30`,
                    '-i', 'lock.png',
                    '-i', 'signal.wav',
                    '-i', 'text.png',
                    '-filter_complex', filterComplex,
                    '-map', '[outv]', '-map', '2:a',
                    '-c:v', 'libx264', '-preset', 'ultrafast',
                    '-c:a', 'aac', '-pix_fmt', 'yuv420p',
                    '-shortest',
                    outName
                ];
            }

            await ffmpeg.run(...args);
            const res = ffmpeg.FS('readFile', outName);
            self.postMessage({ type: 'DONE', buffer: res.buffer, fileType: 'video/mp4', fileName: outName }, [res.buffer]);

            try {
                ffmpeg.FS('unlink', 'signal.wav');
                if(videoFile) ffmpeg.FS('unlink', 'input.mp4');
                if(visualAssets) { ffmpeg.FS('unlink', 'lock.png'); ffmpeg.FS('unlink', 'text.png'); }
                ffmpeg.FS('unlink', outName);
            } catch(e){}

        } catch (err) { self.postMessage({ type: 'ERROR', msg: err.message }); }
    }
};
