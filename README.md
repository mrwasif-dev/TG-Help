# 🤖 TG-Help - Telegram Support Bot

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/mrwasif-dev/TG-Help)

A professional Telegram Support Chat Bot with complete ticket management system. Built with Node.js and Telegraf.js.

## ✨ Features

- 🎫 **Ticket System**: Create and manage support tickets
- 👑 **Admin Panel**: Complete dashboard with statistics
- 💬 **Real-time Chat**: Live chat between users and admin
- 📊 **Analytics**: Detailed reporting and statistics
- 🚀 **One-Click Deployment**: Deploy to Heroku in seconds

## 🚀 Quick Deployment

1. **Click the "Deploy to Heroku" button above**
2. **Enter your credentials:**
   - `BOT_TOKEN`: From @BotFather on Telegram
   - `ADMIN_ID`: From @userinfobot on Telegram
3. **That's it!** Your bot will be deployed automatically

## 📖 Usage

### For Users:
1. Start bot with `/start`
2. Select issue type
3. Wait for admin approval
4. Start chatting with admin

### For Admin:
1. Start bot with `/start`
2. Access admin panel
3. Manage pending requests
4. Chat with users

## 🛠️ Local Development

```bash
# Clone repository
git clone https://github.com/mrwasif-dev/TG-Help.git
cd TG-Help

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Start bot
npm start
