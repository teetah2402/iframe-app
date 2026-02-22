//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\public\apps-cloud\secret-signal\js\audio-engine.js total lines 370 
//#1. Dynamic Component Discovery (DCD): Hub wajib melakukan scanning file secara otomatis.
//#2. Lazy Loading: Modul hanya di-import ke RAM saat dipanggil (On-Demand).
//#3. Atomic Isolation: 1 File = 1 Fungsi dengan nama file yang identik dengan nama fungsi aslinya.
//#4. Zero Logic Mutation: Dilarang merubah alur logika, nama variabel, atau struktur if/try/loop.
//#######################################################################

window.AudioCore = {
    worker: null,
    audioCtx: null,
    bridgeUrl: 'http://localhost:3000/hack-stream',

    tempCachedData: null,

    async initCtx() {
        if (!this.worker) this.createWorker();
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
    },

    createWorker() {
        if (this.worker) this.worker.terminate();
        this.worker = new Worker('js/worker.js');

        this.worker.onmessage = (e) => {
            const { type, msg, buffer, fileType, fileName } = e.data;
            if (type === 'ERROR') {
                SysUI.toast(msg, "error");
                this.toggleLoading(false);
            } else if (type === 'DONE') {
                this.showPreview(buffer, fileType, fileName);
                this.toggleLoading(false);
            }
        };
    },

    async processEncoding() {
        const msgInput = document.getElementById('secret-msg').value;
        const passInput = document.getElementById('encrypt-pass').value;
        const videoInput = document.getElementById('carrier-video').files[0];
        const formatSelect = document.getElementById('output-format').value;
        const ratioSelect = document.getElementById('aspect-ratio').value;
        const isVertical = ratioSelect === '9:16';

        if (!msgInput) { SysUI.toast("INPUT KOSONG BRO!", "error"); return; }

        this.toggleLoading(true, "INITIALIZING SYSTEM...");
        this.createWorker();
        await new Promise(r => setTimeout(r, 500));
        this.worker.postMessage({ type: 'INIT' });

        try {
            let finalPayload = msgInput;
            if (passInput) {
                this.updateLoadingText("ENCRYPTING AES-256...");
                const encrypted = CryptoJS.AES.encrypt(msgInput, passInput).toString();
                finalPayload = "ENC::" + encrypted;
            }

            this.updateLoadingText("MODULATING FSK SIGNAL...");
            const audioWavBuffer = await this.textToFSKAudio(finalPayload);

            let visualAssets = null;
            if (!videoInput && formatSelect === 'mp4') {
                this.updateLoadingText("RENDERING VISUALS...");
                const svgElement = document.getElementById('source-svg-el');
                const lockBuffer = await this.createLockComposite(svgElement);
                const statusText = passInput ? "SECURE AES-256 ENCRYPTED" : "VIDEO INI MENGANDUNG PESAN RAHASIA";
                const textBuffer = await this.createWarningText(statusText, isVertical);
                visualAssets = { logo: lockBuffer, text: textBuffer };
            }

            this.updateLoadingText("COMPILING MEDIA...");
            const videoBuffer = videoInput ? await videoInput.arrayBuffer() : null;

            this.worker.postMessage({
                type: 'ENCODE',
                data: {
                    videoFile: videoBuffer,
                    audioBuffer: audioWavBuffer,
                    visualAssets: visualAssets,
                    outputFormat: formatSelect,
                    aspectRatio: ratioSelect
                }
            }, [audioWavBuffer, ...(videoBuffer ? [videoBuffer] : [])]);

        } catch (e) {
            SysUI.toast("ERROR: " + e.message, "error");
            this.toggleLoading(false);
        }
    },

    async processLinkDecoding() {
        const urlInput = document.getElementById('social-link-input').value;
        if(!urlInput) { SysUI.toast("LINK KOSONG BRO!", "error"); return; }

        this.toggleLoading(true, "MENGHUBUNGI BRIDGE SERVER...");

        try {
            const response = await fetch(this.bridgeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: urlInput })
            });

            if (!response.ok) throw new Error("BRIDGE GAGAL DOWNLOAD");

            this.updateLoadingText("MENERIMA DATA AUDIO...");
            const arrayBuffer = await response.arrayBuffer();
            await this.decodeProcess(arrayBuffer);

        } catch (e) {
            console.error(e);
            this.toggleLoading(false);
            alert("BRIDGE ERROR: Pastikan 'node bridge.js' jalan.");
        }
    },

    async processDecoding(fileInput) {
        if(!fileInput.files[0]) return;
        this.toggleLoading(true, "MEMBACA FILE...");
        try {
            const file = fileInput.files[0];
            const arrayBuffer = await file.arrayBuffer();
            await this.decodeProcess(arrayBuffer);
        } catch (e) {
            this.toggleLoading(false);
            SysUI.toast("FILE ERROR", "error");
        }
        fileInput.value = '';
    },

    async decodeProcess(arrayBuffer) {
        if(!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
        const channelData = audioBuffer.getChannelData(0);

        this.updateLoadingText("ANALISA SPEKTRUM...");

        let extractedText = await this.decodeFSKSignal(channelData, audioBuffer.sampleRate);

        this.toggleLoading(false);

        this.tempCachedData = null;

        if (extractedText && extractedText.length > 0) {

            if (extractedText.startsWith("ENC::")) {
                this.tempCachedData = extractedText; // Simpan di RAM

                const passInput = document.getElementById('decrypt-pass').value;

                if (!passInput) {
                    this.openUnlockModal();
                } else {
                    this.tryDecrypt(extractedText, passInput);
                }
            } else {
                this.showDecodedResult("PESAN TERBACA", extractedText);
                SysUI.toast("SUCCESS", "success");
            }
        } else {
            this.showDecodedResult("ZONK", "Sinyal tidak ditemukan.");
            SysUI.toast("NO SIGNAL", "error");
        }
    },

    tryDecrypt(fullText, password) {
        try {
            const cipherText = fullText.replace("ENC::", "");
            const bytes = CryptoJS.AES.decrypt(cipherText, password);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);

            if(decrypted && decrypted.length > 0) {
                this.showDecodedResult("BERHASIL DIBUKA", decrypted);
                SysUI.toast("SUCCESS", "success");

                document.getElementById('modal-unlock').classList.add('hidden');
                document.getElementById('modal-unlock').classList.remove('flex');
                document.getElementById('decrypt-pass').value = password;
            } else {
                throw new Error("Wrong Password");
            }
        } catch(e) {
            this.openUnlockModal();
            SysUI.toast("PASSWORD SALAH!", "error");

            const input = document.getElementById('modal-pass-input');
            input.classList.add('border-red-500', 'animate-pulse');
            setTimeout(() => input.classList.remove('border-red-500', 'animate-pulse'), 500);
        }
    },

    openUnlockModal() {
        const modal = document.getElementById('modal-unlock');
        const input = document.getElementById('modal-pass-input');
        input.value = ''; // Kosongkan input
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        input.focus();
    },

    retryDecryption() {
        const pass = document.getElementById('modal-pass-input').value;
        if(!pass) { SysUI.toast("MASUKKAN PASSWORD!", "error"); return; }

        if(this.tempCachedData) {
            this.tryDecrypt(this.tempCachedData, pass);
        } else {
            SysUI.toast("DATA HILANG, RE-UPLOAD FILE!", "error");
            document.getElementById('modal-unlock').classList.add('hidden');
        }
    },

    textToFSKAudio(text) {
        return new Promise(resolve => {
            const sampleRate = 44100;
            const baudRate = 20;
            const samplesPerBit = Math.floor(sampleRate / baudRate);
            let binaryStr = '';
            for (let i = 0; i < text.length; i++) {
                let bin = text.charCodeAt(i).toString(2);
                binaryStr += "00000000".slice(bin.length) + bin;
            }
            const preamble = "101010101010101010101010";
            const fullSignal = preamble + binaryStr;
            const totalSamples = (fullSignal.length + baudRate*2) * samplesPerBit;
            const buffer = new Float32Array(totalSamples);
            const freqHigh = 2400; const freqLow = 1200;
            let offset = 0; let phase = 0;
            for (let i = 0; i < fullSignal.length; i++) {
                const freq = fullSignal[i] === '1' ? freqHigh : freqLow;
                for (let j = 0; j < samplesPerBit; j++) {
                    phase += 2 * Math.PI * freq / sampleRate;
                    buffer[offset++] = Math.sin(phase);
                }
            }
            resolve(this.encodeWAV(buffer, sampleRate));
        });
    },

    decodeFSKSignal(channelData, sampleRate) {
        return new Promise(resolve => {
            const baudRate = 20;
            const samplesPerBit = Math.floor(sampleRate / baudRate);
            const freqHigh = 2400; const freqLow = 1200;

            const getMagnitude = (startIdx, freq) => {
                let sum = 0;
                const checkLen = Math.floor(samplesPerBit * 0.6);
                const offset = Math.floor(samplesPerBit * 0.2);
                for (let i = 0; i < checkLen; i++) {
                    const idx = startIdx + offset + i;
                    if(idx >= channelData.length) break;
                    const angle = 2 * Math.PI * freq * i / sampleRate;
                    sum += channelData[idx] * Math.sin(angle);
                }
                return Math.abs(sum);
            };

            let startIndex = -1;
            for(let i = 0; i < channelData.length - samplesPerBit * 10; i += Math.floor(samplesPerBit/2)) {
                if (getMagnitude(i, freqHigh) > 3 || getMagnitude(i, freqLow) > 3) {
                    startIndex = i; break;
                }
            }
            if (startIndex === -1) { resolve(null); return; }

            let rawBits = "";
            let currentIdx = startIndex;
            while(currentIdx < channelData.length) {
                const magH = getMagnitude(currentIdx, freqHigh);
                const magL = getMagnitude(currentIdx, freqLow);
                if (magH > magL) rawBits += "1"; else rawBits += "0";
                currentIdx += samplesPerBit;
            }

            let bestResult = "";
            for(let offset = 0; offset < 8; offset++) {
                let currentString = "";
                for (let i = offset; i < rawBits.length; i += 8) {
                    const byteStr = rawBits.substr(i, 8);
                    if(byteStr.length < 8) break;
                    const charCode = parseInt(byteStr, 2);
                    if (charCode >= 32 && charCode <= 126) currentString += String.fromCharCode(charCode);
                }
                if (currentString.length > bestResult.length) bestResult = currentString;
            }
            resolve(bestResult.replace(/^[*U\s]+/, '').trim());
        });
    },

    encodeWAV(samples, sampleRate) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);
        const writeString = (v, o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
        writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
        writeString(view, 36, 'data'); view.setUint32(40, samples.length * 2, true);
        let offset = 44;
        for (let i = 0; i < samples.length; i++) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset += 2;
        }
        return buffer;
    },

    createWarningText(text, isVertical = false) {
        return new Promise(resolve => {
            const canvas = document.createElement('canvas');
            const width = isVertical ? 650 : 1280;
            const height = isVertical ? 200 : 160;
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, width, height);
            ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 6; ctx.strokeRect(0, 0, width, height);
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffff00'; ctx.font = `${isVertical ? "900 24px" : "900 32px"} "Arial Black"`;
            ctx.fillText("⚠ " + text, width/2, height/2 - 40);
            ctx.fillStyle = '#ffffff'; ctx.font = `${isVertical ? "bold 12px" : "bold 18px"} "Courier New"`;
            ctx.fillText("INI PESAN RAHASIA, DECRYPT UNTUK MEMBACA PESAN:", width/2, height/2 + 5);
            ctx.fillStyle = '#54d7f6'; ctx.font = `${isVertical ? "bold 14px" : "bold 20px"} "Courier New"`;
            ctx.fillText("GUNAKAN : flowork.cloud/app/secret-signal", width/2, height/2 + 40);
            canvas.toBlob(blob => blob.arrayBuffer().then(resolve), 'image/png');
        });
    },

    createLockComposite(svg) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d'); ctx.fillStyle = '#0f111a'; ctx.fillRect(0,0,512,512);
            const svgData = new XMLSerializer().serializeToString(svg);
            const img = new Image(); img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
            img.onload = () => { ctx.drawImage(img, 128, 128, 256, 256); canvas.toBlob(b => b.arrayBuffer().then(resolve), 'image/png'); };
        });
    },

    toggleLoading(show, text) {
        const el = document.getElementById('loading-overlay');
        const txt = document.getElementById('loading-text');
        if(show) { el.classList.remove('hidden'); if(text) txt.innerText = text; }
        else { el.classList.add('hidden'); }
    },
    updateLoadingText(text) { document.getElementById('loading-text').innerText = text; },

    showPreview(buffer, type, name) {
        const url = URL.createObjectURL(new Blob([buffer], { type: type }));
        const container = document.getElementById('preview-container');
        container.innerHTML = `<div class="flex flex-col items-center gap-4"><video controls src="${url}" class="max-w-sm rounded border border-gray-700"></video><a href="${url}" download="${name}" class="px-6 py-3 bg-cyan-600 text-black font-bold rounded">DOWNLOAD RESULT</a></div>`;
    },

    showDecodedResult(title, message) {
        const container = document.getElementById('section-decode-result');
        const resultHTML = `
            <div class="bg-[#0f111a] border-2 border-green-500 p-8 rounded-lg text-center animate-enter relative overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.2)] mt-6">
                <div class="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500 animate-pulse">
                    <i data-lucide="radio-receiver" class="w-10 h-10 text-green-400"></i>
                </div>
                <h3 class="text-2xl font-black text-white mb-2 font-hud uppercase">${title}</h3>
                <div class="bg-black p-6 rounded border border-green-800 mt-6 relative group text-left">
                    <div class="absolute top-0 left-0 bg-green-600 text-black text-[9px] font-bold px-2 py-0.5">RAW DATA</div>
                    <p class="font-mono text-lg text-green-400 break-words leading-relaxed">${message}</p>
                </div>
            </div>`;
        container.innerHTML = resultHTML;
        lucide.createIcons();
    }
};
