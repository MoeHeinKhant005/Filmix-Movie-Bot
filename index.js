require('dotenv').config();

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const movieDataPath = path.join(__dirname, "database.json");

const TelegramBot = require('node-telegram-bot-api');
const BotToken = process.env.BOT_TOKEN;
const AdminID = process.env.ADMIN_ID;
const BotUsername = process.env.BOT_USERNAME;

const bot = new TelegramBot(BotToken, {
    polling: true
})

// Validation
function isAdmin(msg){
    if(String(msg.from.id) === AdminID){
        return true;
    }else{
        bot.sendMessage(msg.chat.id, "⛔️ မအောင်မြင်ပါ။ သင့်တွင် Filmix ၏ Database အတွင်းသို့ဝင်ရောက်ရန်လိုအပ်သော Permission Access များမရှှိပါခင်ဗျာ။")
        return false;
    }
}

// Loading movie data from JSON file
function loadMovieData(){
    const rawMovies = fs.readFileSync(movieDataPath, "utf-8");
    const movies = JSON.parse(rawMovies);
    return movies;
}

// Converting the inserted data into JSON format
function parseMovieData(insertedData){
    const data = {};
    for (const line of insertedData.split(",")){
        const separator = line.indexOf("=");

        if(separator === "-1") continue;

        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim();

        if(key){
            data[key] = value;
        }
    }
    return data;
}

// Saving new movies to the JSON file
function saveNewMovie(msg){
    const movieData = loadMovieData();
    const movieId = crypto.randomBytes(4).toString('hex');
    const movieInfo = parseMovieData(msg.caption || "");

    // Writing new movie data to JSON file
    movieData[movieId] = {
        file_id: msg.video.file_id,
        ...movieInfo,
    };

    // Saving the file
    fs.writeFileSync(movieDataPath, JSON.stringify(movieData));

    bot.sendMessage(msg.chat.id, `✅ Filmix ၏ Database အတွင်းသုိ့ရုပ်ရှင်အသစ်အားအောင်မြင်စွာထည့်သွင်းပြီးပါပြီခင်ဗျာ။\n\n👇 အောက်ပါ Link မှတစ်ဆင့်ဝင်ရောက်ကြည့်ရှုနိုင်ပါပြီခင်ဗျာ။\n\n🌐 - https://t.me/${BotUsername}?start=${movieId}`);
}

// Check the message type and saving the new data
bot.on('message', msg => {
    if(msg.video && isAdmin(msg)){
        saveNewMovie(msg);
    }
})

// Fetching the movie ID from the user request
bot.onText(/^\/start(?:\s+(.+))?$/, async (msg, match) => {
    const movieId = match[1];
    const movieData = loadMovieData();

    if(!movieId){
        // If there is no movie ID in the query
        bot.sendMessage(msg.chat.id, "👋 မင်္ဂလာပါခင်ဗျာ။ Filmix - Movie Vault မှကြုိဆိုပါတယ်။\n\n📺 ရုပ်ရှင်များကြည့်ရန် Channel မှသက်ဆိုင်ရာခလုတ်များအားနှိပ်ပေးပါခင်ဗျာ။", {
            reply_markup: {
                inline_keyboard: [
                    [
                        { 
                            text: "🎬 Channel သို့သွားမည်",
                            url: "https://t.me/filmix_movie06",
                        }
                    ]
                ]
            }
        })
    }else{
        // Select a movie with its ID
        const selectedMovie = movieData[movieId];

        // Creating a new movie caption
        const caption = `<b>${selectedMovie.title} (${selectedMovie.releaseDate})</b>\n\n🎞 Filmix - Movie Channel တွင်လည်းအခြားသောစိတ်ဝင်စားဖွယ် Movie နှင့် Series များစွာကိုဝင်ရောက်ကြည့်ရှုနိုင်ပါပြီခင်ဗျာ။\n\n🗑 The content shared on this channel may be owned by third-party copyright holders. All rights remain with their respective owners.`
        
        // Sending the user with the movie
        bot.sendVideo(msg.chat.id, selectedMovie.file_id, {
            caption: caption,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        { 
                            text: "🎬 Channel သို့သွားမည်",
                            url: "https://t.me/filmix_movie06",
                        }
                    ]
                ]
            }
        });
    }
})

bot.on("polling_error", error => {
    console.error(`Polling error: ${error.message}`)
})
