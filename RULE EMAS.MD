LO PELAJARI RULE TEMPLATE DI BAWAH INI , KITA AKAN REFACTORY APP AGAR MEMENUHI 7 SYARAT INI, JIKA SUDAH PAHAM AKU AKAN KIRIM KODE  TUGAS PERTAMA DAN YANG WAJIB LO TAHU LO DILARANG RUBAH LOGIC, HANYA BOLEH REDESIGN INGAT ITU, JANGAN BUANG FILTUR ITU HARAM
________________________________________
📜 8 PILAR ALIRAN DESAIN GUMMY V5.1 (CARNIVAL EDITION)
1.	Sistem Tema & i18n (Dynamic & Instant):
o	Theme: Pakai CSS Variables. Wajib Instant via vuetify.theme.global.name.value.
o	Language: Wajib kamus dinamis {{ t.variabel }}. Haram ketik teks mati di HTML.
2.	Palet Warna Carnival (Anti-Boring & High Contrast):
o	Haram: Teks warna Hitam kaku (#000) atau Putih kaku (#FFF).
o	Light Mode: BG Core #F0F4FF. Card #FFFFFF. Teks Utama #1E1B4B (Deep Indigo).
o	Dark Mode: BG Core #0F172A. Card #1E293B. Teks Utama #E0F2FE (Pearl Cyan).
o	Aksen Ceria: Pink Neon (#F72585), Android Green (#3DDC84), Cyber Yellow (#FEE440), Sky Blue (#00BBF9).
3.	Anti-Native UI (Gummy Modals Only):
o	Haram alert(), confirm(), prompt(). Wajib <v-dialog> dengan desain membal.
4.	Estetika "Engraved & 3D Bouncy":
o	Bentuk: Rounded ekstrim (rounded-[2.5rem]).
o	Input Look: Efek "Diukir" (Background redup, border 3px, teks warna Android Green/Sky Blue).
o	Tombol: 3D dengan border-bottom 6px-8px (Amblas saat diklik).
5.	Arsitektur 3-File & App-First:
o	Struktur: index.html, partials/lander.html, partials/app.html.
o	Default View: Langsung masuk ke Workspace (currentTab = 'app').
6.	Garis Mati 85px & Internal Scroll:
o	Fixed Frame: Layout utama overflow-hidden. Internal scroll hanya di dalam Card.
o	Gap Footer: Di Workspace wajib pb-[85px] agar tidak tertutup UI sistem.
7.	Auto-Save State (Persistence):
o	Wajib watch data secara deep: true ke localStorage. Load saat onMounted.
________________________________________

1.HAK LU HANYA MENAMBAHKAN BARIS KODE BUKAN MENGURANGI, JIKA ADA BARIS KODE YANG NGGAK KEPAKE KASIH KOMEN, JIKA LU HABIS MENAMBAHKAN FILE BARU DAN ADA FILE LAMA YANG MENJADI ZOMBIE SEGERA BERITAHU
2,WAJIB SELALU BERIKAN FULL CODE PADA FILE YANG DI PERBAIKI (FULL CODE ARTINYA NGGAK ADA YANG DI PASS DAN DI TAMBAH MANUAL) khusus kode kamus (bahsa jangan berikan full cukup kekurangan ya saja)
3.KALAU LU NGGAK PUNYA FILENYA JANGAN HALU , MINTA SAMA GW
4.JANGAN JAWAB BERDASARKAN ASUMSI TAPI LU HARUS SCAN SEMUA KODE YANG BERHUBUNGAN DENGAN PERMASALAHAN dan tampilkan bukti


💻 MASTER TEMPLATE (THE PATTERN)
1. index.html (The Engine)
HTML
<!DOCTYPE html>
<html lang="id" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>GUMMY V5.1 CARNIVAL</title>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/vuetify@3.5.2/dist/vuetify.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/vuetify@3.5.2/dist/vuetify.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;800&family=Quicksand:wght@500;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/@mdi/font@5.x/css/materialdesignicons.min.css" rel="stylesheet">
    <style>
        :root {
            --bg-core: #F0F4FF; --bg-panel: #FFFFFF; --text-main: #1E1B4B;
            --border-color: #CBD5E1; --brand-color: #F72585;
            --green-android: #3DDC84; --yellow-cyber: #FEE440; --blue-sky: #00BBF9;
            --text-on-btn: #1E1B4B;
        }
        [data-theme='dark'] {
            --bg-core: #0F172A; --bg-panel: #1E293B; --text-main: #E0F2FE !important;
            --border-color: #334155; --brand-color: #FF006E;
            --text-on-btn: #E0F2FE;
        }
        * { -ms-overflow-style: none; scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
        html, body { background-color: var(--bg-core); color: var(--text-main); width: 100%; height: 100dvh; overflow: hidden; margin: 0; font-family: 'Quicksand', sans-serif; }
        .gummy-board { background: var(--bg-panel); border-radius: 2.5rem; border: 4px solid var(--border-color); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .input-carved { background: rgba(0,0,0,0.05) !important; border: 3px solid var(--border-color) !important; border-radius: 1.8rem !important; font-weight: 800; color: var(--blue-sky) !important; }
        .btn-game { background-color: var(--brand-color) !important; color: var(--text-on-btn) !important; border-bottom: 6px solid rgba(0,0,0,0.25); border-radius: 1.8rem; font-family: 'Fredoka', sans-serif; font-weight: 800; transition: all 0.1s; text-transform: uppercase; padding: 1rem 2rem; }
        .btn-game:active { border-bottom-width: 0px; transform: translateY(6px); }
        .font-display { font-family: 'Fredoka', sans-serif; }
    </style>
</head>
<body>
    <div id="vue-root"></div>
    <script>
        const AppCore = {
            async init() {
                const cb = Date.now();
                const [rLander, rApp] = await Promise.all([fetch('partials/lander.html?v='+cb), fetch('partials/app.html?v='+cb)]);
                this.initVue(await rLander.text(), await rApp.text());
            },
            initVue(tLander, tApp) {
                const { createApp, ref, computed, watch, onMounted } = Vue;
                const { createVuetify } = Vuetify;
                const savedTheme = localStorage.getItem('flowork_os_theme') || 'dark';
                const vuetify = createVuetify({ theme: { defaultTheme: savedTheme } });
                const app = createApp({
                    template: `
                    <v-app style="background: transparent;">
                        <header class="w-full h-20 bg-panel border-b-4 border-border z-50 px-6 flex justify-between items-center shrink-0">
                            <h1 class="font-display text-2xl font-black text-main uppercase italic">APP<span class="text-brand">NAME</span></h1>
                            <div class="flex gap-6 h-full items-end pb-3">
                                <button @click="currentTab = 'lander'" :class="currentTab === 'lander' ? 'text-brand border-b-4 border-brand font-black' : 'text-main font-bold opacity-50'">INFO</button>
                                <button @click="currentTab = 'app'" :class="currentTab === 'app' ? 'text-brand border-b-4 border-brand font-black' : 'text-main font-bold opacity-50'">WORKSPACE</button>
                            </div>
                        </header>
                        <v-main class="flex-1 relative overflow-hidden">
                            <transition name="tab-fade"><div v-show="currentTab === 'lander'" class="absolute inset-0 pb-6 pt-4 px-4 md:px-8 overflow-hidden">${tLander}</div></transition>
                            <transition name="tab-fade"><div v-show="currentTab === 'app'" class="absolute inset-0 pb-[85px] pt-4 px-4 md:px-8 overflow-hidden">${tApp}</div></transition>
                        </v-main>
                    </v-app>`,
                    setup() {
                        const currentTab = ref('app');
                        const currentLang = ref(localStorage.getItem('flowork_lang') || 'id');
                        const t = computed(() => i18n[currentLang.value] || i18n['id']);
                        const appState = ref({ input: "" });
                        onMounted(() => { const draft = localStorage.getItem('flowork_app_draft'); if(draft) appState.value = JSON.parse(draft); });
                        watch(appState, (v) => localStorage.setItem('flowork_app_draft', JSON.stringify(v)), { deep: true });
                        return { currentTab, t, appState };
                    }
                });
                app.use(vuetify).mount('#vue-root');
                window.addEventListener('message', (e) => {
                    if (e.data?.type === 'THEME_CHANGE') {
                        vuetify.theme.global.name.value = e.data.theme;
                        document.documentElement.setAttribute('data-theme', e.data.theme);
                    }
                });
            }
        };
        window.onload = () => AppCore.init();
    </script>
</body>
</html>
2. partials/lander.html
HTML
<div class="flex flex-col items-center justify-center h-full w-full">
    <div class="gummy-board p-10 md:p-20 w-full max-w-6xl flex flex-col xl:flex-row gap-12 items-center">
        <div class="flex-grow text-center xl:text-left">
            <div class="inline-block bg-[var(--yellow-cyber)] text-[#1E1B4B] px-6 py-2 rounded-full font-black uppercase text-[10px] mb-8 tracking-[0.3em] animate-bounce">
                🚀 {{ t.landerBadge }}
            </div>
            <h1 class="font-display text-6xl md:text-8xl font-black text-main mb-8 leading-tight uppercase italic">
                {{ t.landerTitle }} <span class="text-brand">{{ t.landerTitleHl }}</span>
            </h1>
            <p class="text-xl md:text-2xl text-[var(--text-muted)] font-bold mb-12 max-w-2xl leading-relaxed">
                {{ t.landerDesc }}
            </p>
            <button @click="currentTab = 'app'" class="btn-game text-xl md:text-2xl px-16 py-6 !bg-[var(--blue-sky)]">
                GO TO WORKSPACE
            </button>
        </div>
        <div class="hidden xl:grid w-[350px] grid-cols-1 gap-4">
            <div class="bg-core p-8 rounded-[2.5rem] border-4 border-dashed border-border flex flex-col items-center text-center rotate-3">
                <v-icon icon="mdi-star" size="80" class="text-[var(--yellow-cyber)] mb-4"></v-icon>
                <div class="text-main font-black uppercase text-xs tracking-widest">PREMIUM QUALITY</div>
            </div>
        </div>
    </div>
</div>
3. partials/app.html
HTML
<div class="flex flex-col xl:flex-row gap-6 h-full w-full overflow-hidden">
    <div class="flex-grow gummy-board p-6 md:p-8 flex flex-col h-full overflow-y-auto !border-[var(--blue-sky)]">
        <h2 class="font-display text-3xl font-black text-main uppercase border-b-8 border-dashed border-border pb-6 mb-8">
            {{ t.appTitle }} 🛠️
        </h2>
        <div class="space-y-6">
            <div class="p-8 bg-core rounded-[2.5rem] border-2 border-border">
                <label class="text-[10px] font-black text-[var(--text-muted)] uppercase pl-4 mb-2 block">CARNIVAL INPUT</label>
                <div class="input-carved p-6 text-2xl">
                    THIS IS HIGH CONTRAST TEXT
                </div>
            </div>
        </div>
    </div>
    <div class="w-full xl:w-[400px] gummy-board p-8 flex flex-col h-full overflow-y-auto shrink-0 !border-[var(--yellow-cyber)]">
        <h3 class="font-display text-xl font-black text-main uppercase border-b-4 border-border pb-4 mb-8">SUMMARY ⚙️</h3>
        <div class="mt-auto bg-[var(--green-android)] p-8 rounded-[2.5rem] text-[#1E1B4B]">
            <div class="text-[10px] font-black uppercase opacity-70 mb-1">TOTAL STATUS</div>
            <div class="text-3xl font-display font-black leading-tight italic">SUPER SECURE</div>
        </div>
        <button class="btn-game w-full mt-6 py-5 !bg-[var(--yellow-cyber)] !text-[#1E1B4B] !border-b-8">
            PROSES DATA
        </button>
    </div>
</div>
________________________________________
 

