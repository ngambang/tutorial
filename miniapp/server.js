
// Ganti dengan token bot Anda
const token = '7591794125:AAHH3ZoZejug_ZSeuDWts_8_68Cw32HRC4';
const webAppUrl = 'https://0022-125-164-3-47.ngrok-free.app/miniapp/index.html'.trim();
const TelegramBot = require('node-telegram-bot-api');
// Buat instance bot dengan polling (tanpa webhook)
const bot = new TelegramBot(token, {
    polling: true,
    polling_interval: 300,
    debug: true
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    console.log('User memulai bot:', msg.from);

    bot.sendMessage(chatId, 'Selamat datang! Klik tombol di bawah untuk membuka Web App:', {
        reply_markup: {
            keyboard: [[{
                text: '🚀 Buka Mini App',
                web_app: {url: webAppUrl}
            }]],
            resize_keyboard: true
        }
    });
});

// Handler khusus untuk web_app_data
bot.on('web_app_data', (msg) => {
    const chatId = msg.chat.id;
    console.log('Menerima data dari Web App:', msg.web_app_data);
    
    try {
        // Mengambil data dari web_app_data dan parsing
        const data = JSON.parse(msg.web_app_data.data);
        
        // Mengirimkan pesan yang berisi data yang diterima
        bot.sendMessage(chatId, `
✅ Data diterima dari Web App:
📝 Pesan: ${data.message} 
⏰ Waktu: ${data.timestamp} 
📱 Platform: ${data.platform} 
🆔 ID user: ${chatId}
        `);
    } catch (e) {
        console.error('Error parsing web_app_data:', e);
        bot.sendMessage(chatId, '❌ Error memproses data: ' + e.message);
    }
});


// Debug: Log semua error
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

// Debug: Log ketika bot mulai
console.log('Bot started...');