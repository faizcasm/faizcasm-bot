import fetch from 'node-fetch';
import TelegramBot from 'node-telegram-bot-api';
const token = '7274280899:AAEavOKIeP4hF6Lpsu4NBEix02pk1YraMcE';
const weatherApiKey = '8f84537dd15e58ec2cfd7c00618f4c7a';
const bot = new TelegramBot(token, { polling: true });
let coinsList = []; // Will store all available cryptocurrencies

// Fetch all coins on bot start
const fetchAllCoins = async () => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/list');
    coinsList = await response.json();
  } catch (error) {
    console.log("Error fetching coins list:", error);
  }
};

fetchAllCoins(); // Fetch coin list when the bot starts

// Start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome to FaizCasmCoin Bot! 🤖\nType /menu to see the list of commands.");
});

// Menu command
bot.onText(/\/menu/, (msg) => {
  bot.sendMessage(msg.chat.id, "Here are the available commands:\n" +
    "/meme - Get a random meme\n" +
    "/dogecoin - Get current Dogecoin price\n" +
    "/coins - Get prices of major cryptocurrencies\n" +
    "/allcoins - Get prices of all cryptocurrencies (in pages)\n" +
    "/geminiai - Ask Gemini AI\n" +
    "/weather <city> - Get the current weather for a city\n" +
    "/quote - Get a daily quote\n" +
    "/joke - Get a random joke\n" +
    "/convert <amount> <fromCurrency> <toCurrency> - Convert between currencies\n" +
    "/fact - Get a random fact\n" +
    "/image - Get a random image\n" +
    "/trivia - Play a trivia quiz\n" +
    "/reminder <minutes> <text> - Set a reminder\n" +
    "/stats - See your command usage stats");
});

// Help command
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, "Type /menu to see the list of commands.");
});

// Meme command
bot.onText(/\/meme/, async (msg) => {
  try {
    const response = await fetch('https://api.imgflip.com/get_memes');
    const data = await response.json();
    const meme = data.data.memes[Math.floor(Math.random() * data.data.memes.length)];

    bot.sendPhoto(msg.chat.id, meme.url, { caption: meme.name });
  } catch (error) {
    bot.sendMessage(msg.chat.id, "Sorry, I couldn't fetch a meme right now. Try again later!");
  }
});

// Dogecoin price command
bot.onText(/\/dogecoin/, async (msg) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=dogecoin&vs_currencies=usd');
    const data = await response.json();
    const price = data.dogecoin.usd;

    bot.sendMessage(msg.chat.id, `🐕 Current Dogecoin price: $${price}`);
  } catch (error) {
    bot.sendMessage(msg.chat.id, "Sorry, I couldn't fetch the Dogecoin price right now. Try again later!");
  }
});

// List major coins prices
bot.onText(/\/coins/, async (msg) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,dogecoin,cardano,solana&vs_currencies=usd');
    const data = await response.json();

    const message = `
💰 Current Prices:
- Bitcoin (BTC): $${data.bitcoin.usd}
- Ethereum (ETH): $${data.ethereum.usd}
- Dogecoin (DOGE): $${data.dogecoin.usd}
- Cardano (ADA): $${data.cardano.usd}
- Solana (SOL): $${data.solana.usd}
    `;
    bot.sendMessage(msg.chat.id, message);
  } catch (error) {
    bot.sendMessage(msg.chat.id, "Sorry, I couldn't fetch the coins list right now. Try again later!");
  }
});

// Paginated list of all coins and their prices
bot.onText(/\/allcoins(\s(\d+))?/, async (msg, match) => {
  const page = match[2] ? parseInt(match[2], 10) : 1;
  const coinsPerPage = 10;
  const startIndex = (page - 1) * coinsPerPage;
  const endIndex = startIndex + coinsPerPage;

  if (coinsList.length === 0) {
    bot.sendMessage(msg.chat.id, "Loading coin data... Please try again in a moment.");
    return;
  }

  const selectedCoins = coinsList.slice(startIndex, endIndex);
  const coinIds = selectedCoins.map(coin => coin.id).join(',');

  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`);
    const prices = await response.json();

    let message = `💰 Coin Prices (Page ${page}):\n`;
    selectedCoins.forEach(coin => {
      const price = prices[coin.id] ? `$${prices[coin.id].usd}` : "N/A";
      message += `- ${coin.name} (${coin.symbol.toUpperCase()}): ${price}\n`;
    });

    message += `\nType "/allcoins ${page + 1}" for the next page.`;

    bot.sendMessage(msg.chat.id, message);
  } catch (error) {
    bot.sendMessage(msg.chat.id, "Sorry, I couldn't fetch the prices right now. Try again later!");
  }
});

// Gemini AI interaction
bot.onText(/\/geminiai (.+)/, async (msg, match) => {
  const userQuery = match[1]; // Extract user's query

  // Here you would typically send the userQuery to Gemini AI's API to get a response
  // This is a placeholder for making an actual API request to Gemini AI

  try {
    // Assuming there's an API endpoint where you can send the user's query
    const aiResponse = await fetch(`https://geminiai.api/ask?query=${encodeURIComponent(userQuery)}`);
    const data = await aiResponse.json();

    const aiReply = data.reply || "Sorry, I couldn't process that request.";

    bot.sendMessage(msg.chat.id, `Gemini AI says: ${aiReply}`);
  } catch (error) {
    bot.sendMessage(msg.chat.id, "Sorry, Gemini AI is currently unavailable. Please try again later.");
  }
});

// Weather command
bot.onText(/\/weather (.+)/, async (msg, match) => {
  const cityName = match[1]; // Extract city name from the message

  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${weatherApiKey}&units=metric`);
    const data = await response.json();

    if (data.cod === 200) {
      const weather = data.weather[0].description;
      const temperature = data.main.temp;
      const city = data.name;

      bot.sendMessage(msg.chat.id, `🌤️ Weather in ${city}:\n- Description: ${weather}\n- Temperature: ${temperature}°C`);
    } else {
      bot.sendMessage(msg.chat.id, "City not found. Please make sure you entered the city name correctly.");
    }
  } catch (error) {
    bot.sendMessage(msg.chat.id, "Sorry, I couldn't fetch the weather right now. Try again later!");
  }
});

// Admin command
bot.onText(/\/admin/, (msg) => {
    const chatId = msg.chat.id;
    const webAppUrl = 'http://t.me/Faizcasmbot/Faizcasm'; // Replace with the URL of your web application
  
    bot.sendMessage(chatId, `🔗 You can access the admin panel here: ${webAppUrl}`);
  });
  
// Daily Quote command
bot.onText(/\/quote/, async (msg) => {
    try {
      const response = await fetch('https://api.quotable.io/random');
      const data = await response.json();
      const quote = data.content;
      const author = data.author;
  
      bot.sendMessage(msg.chat.id, `💬 "${quote}"\n— ${author}`);
    } catch (error) {
      bot.sendMessage(msg.chat.id, "Sorry, I couldn't fetch a quote right now. Try again later!");
    }
  });

// Joke command
bot.onText(/\/joke/, async (msg) => {
    try {
      const response = await fetch('https://official-joke-api.appspot.com/random_joke');
      const data = await response.json();
      const joke = `${data.setup} ${data.punchline}`;
  
      bot.sendMessage(msg.chat.id, `😂 ${joke}`);
    } catch (error) {
      bot.sendMessage(msg.chat.id, "Sorry, I couldn't fetch a joke right now. Try again later!");
    }
  });

// Currency Converter command
bot.onText(/\/convert (\d+) (\w+) (\w+)/, async (msg, match) => {
    const amount = match[1];
    const fromCurrency = match[2].toUpperCase();
    const toCurrency = match[3].toUpperCase();

    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
        const data = await response.json();
        const rate = data.rates[toCurrency];
        if (rate) {
            const convertedAmount = (amount * rate).toFixed(2);
            bot.sendMessage(msg.chat.id, `💵 ${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`);
        } else {
            bot.sendMessage(msg.chat.id, "Currency not supported or invalid.");
        }
    } catch (error) {
        bot.sendMessage(msg.chat.id, "Sorry, I couldn't convert the currency right now. Try again later!");
    }
});

// Random Fact command
bot.onText(/\/fact/, async (msg) => {
    try {
        const response = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
        const data = await response.json();
        const fact = data.text;
  
        bot.sendMessage(msg.chat.id, `🔍 Fact: ${fact}`);
    } catch (error) {
        bot.sendMessage(msg.chat.id, "Sorry, I couldn't fetch a fact right now. Try again later!");
    }
});

// Random Image command
bot.onText(/\/image/, async (msg) => {
    try {
        const response = await fetch('https://picsum.photos/200');
        const imageUrl = response.url;
  
        bot.sendPhoto(msg.chat.id, imageUrl);
    } catch (error) {
        bot.sendMessage(msg.chat.id, "Sorry, I couldn't fetch an image right now. Try again later!");
    }
});

// Trivia command
bot.onText(/\/trivia/, async (msg) => {
    try {
        const response = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
        const data = await response.json();
        const trivia = data.results[0];
        const question = trivia.question;
        const options = [...trivia.incorrect_answers, trivia.correct_answer].sort(() => Math.random() - 0.5);
  
        bot.sendMessage(msg.chat.id, `🎓 Trivia Question: ${question}\nOptions:\n${options.map((option, index) => `${index + 1}. ${option}`).join('\n')}`);
    } catch (error) {
        bot.sendMessage(msg.chat.id, "Sorry, I couldn't fetch trivia right now. Try again later!");
    }
});

// Reminder command
bot.onText(/\/reminder (\d+) (.+)/, (msg, match) => {
    const minutes = parseInt(match[1], 10);
    const text = match[2];
    const userId = msg.from.id;

    if (!isNaN(minutes) && minutes > 0) {
        setTimeout(() => {
            bot.sendMessage(userId, `⏰ Reminder: ${text}`);
        }, minutes * 60 * 1000);

        bot.sendMessage(msg.chat.id, `✅ Reminder set for ${minutes} minute(s).`);
    } else {
        bot.sendMessage(msg.chat.id, "Please provide a valid number of minutes for the reminder.");
    }
});

// Stats command
bot.onText(/\/stats/, (msg) => {
    const userId = msg.from.id;

    // For simplicity, using a static response here
    bot.sendMessage(msg.chat.id, "📊 Command usage stats are not implemented yet.");
});
