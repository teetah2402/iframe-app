//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\public\apps-cloud\secret-signal\js\app.js total lines 136 
//#1. Dynamic Component Discovery (DCD): Hub wajib melakukan scanning file secara otomatis.
//#2. Lazy Loading: Modul hanya di-import ke RAM saat dipanggil (On-Demand).
//#3. Atomic Isolation: 1 File = 1 Fungsi dengan nama file yang identik dengan nama fungsi aslinya.
//#4. Zero Logic Mutation: Dilarang merubah alur logika, nama variabel, atau struktur if/try/loop.
//#######################################################################

lucide.createIcons();

function switchTab(tab) {
    document.getElementById('view-encode').classList.add('hidden-view');
    document.getElementById('view-decode').classList.add('hidden-view');
    document.getElementById(`view-${tab}`).classList.remove('hidden-view');

    document.getElementById('tab-encode').classList.remove('text-cyan-400');
    document.getElementById('tab-decode').classList.remove('text-cyan-400');
    document.getElementById(`tab-${tab}`).classList.add('text-cyan-400');
}

async function runEncode() {
    const text = document.getElementById('msg-input').value;
    const pass = document.getElementById('pass-input').value;
    const btn = document.getElementById('btn-encode');

    if(!text) return alert("Pesan kosong!");

    btn.innerText = "PROCESSING ON SERVER...";
    btn.disabled = true;

    try {
        const req = await fetch('/api/signal', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'ENCODE', text: text, password: pass })
        });

        const res = await req.json();

        if(res.success) {
            const audioBlob = base64ToBlob(res.audioData, 'audio/wav');
            const url = URL.createObjectURL(audioBlob);

            const player = document.getElementById('audio-result');
            const dl = document.getElementById('link-download');

            player.src = url;
            dl.href = url;
            dl.download = `secret_signal_${Date.now()}.wav`;

            document.getElementById('preview-area').classList.add('hidden');
            document.getElementById('result-download').classList.remove('hidden');
            document.getElementById('result-download').classList.add('flex');
        } else {
            alert("Error: " + res.error);
        }

    } catch(e) {
        console.error(e);
        alert("Server Error / Connection Failed");
    }

    btn.innerText = "EXECUTE PROCESS";
    btn.disabled = false;
}


let audioCtx;

async function runDecode(input) {
    if(!input.files[0]) return;

    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const file = input.files[0];
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0); // Mono

    const text = await decodeFSK(channelData, audioBuffer.sampleRate);

    const resBox = document.getElementById('decode-result-box');
    const txtEl = document.getElementById('decoded-text');
    const unlockForm = document.getElementById('unlock-form');

    resBox.classList.remove('hidden');

    if (text.startsWith("ENC::")) {
        txtEl.innerText = "[ENCRYPTED DATA DETECTED]";
        txtEl.classList.add('text-red-400');
        unlockForm.classList.remove('hidden');
        window.tempCipher = text;
    } else {
        txtEl.innerText = text;
        txtEl.classList.remove('text-red-400');
        unlockForm.classList.add('hidden');
    }
}

async function runUnlock() {
    const pass = document.getElementById('unlock-pass').value;
    const text = window.tempCipher;

    if(!pass) return alert("Password kosong");

    const req = await fetch('/api/signal', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ action: 'DECRYPT', text: text, password: pass })
    });

    const res = await req.json();

    if(res.success) {
        document.getElementById('decoded-text').innerText = res.result;
        document.getElementById('decoded-text').classList.add('text-green-400');
        document.getElementById('decoded-text').classList.remove('text-red-400');
        document.getElementById('unlock-form').classList.add('hidden');
    } else {
        alert("GAGAL: " + res.error);
    }
}

function base64ToBlob(base64, type) {
    const binStr = atob(base64);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = binStr.charCodeAt(i);
    return new Blob([arr], { type: type });
}

async function decodeFSK(data, rate) {
    const baud = 20;
    const samplesPerBit = Math.floor(rate / baud);
    const freq1 = 2400; const freq0 = 1200;

    return "CONTOH_HASIL_DECODE_NANTI_PAKE_LOGIC_LAMA";
}
