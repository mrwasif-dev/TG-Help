# 🤖 TG-Help - Telegram Support Chat Bot

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/mrwasif-dev/TG-Help)
[![GitHub Stars](https://img.shields.io/github/stars/mrwasif-dev/TG-Help?style=social)](https://github.com/mrwasif-dev/TG-Help/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/mrwasif-dev/TG-Help?style=social)](https://github.com/mrwasif-dev/TG-Help/network/members)

A professional Telegram Support Chat Bot with complete ticket management system. Built with Node.js and Telegraf.js.

## 🚀 One-Click Deployment

Click the button above to deploy your own instance on Heroku. Pre-configured with:

- ✅ BOT_TOKEN: `8395607834:AAE7IJEt1xVs4-WzJxcntAfMES3IcpRnjtg`
- ✅ ADMIN_ID: `6012422087`

**Note:** Replace with your own credentials for security.

## ✨ Features

### 🎫 Complete Ticket System
- Create tickets with unique IDs
- Track ticket status (Pending → Approved → Closed)
- Automatic timestamp for all actions
- Message history storage

### 👑 Admin Control Panel
- Dashboard with real-time statistics
- Pending requests management
- Active chat sessions monitoring
- Approve/Reject with custom reasons
- One-click chat session end

### 💬 Real-time Communication
- Live chat between users and admin
- Message forwarding system
- Notification system for both parties
- Session management

### 📊 Analytics & Reporting
- Daily ticket statistics
- Issue type analysis
- User activity tracking
- Performance metrics

## 🛠️ Quick Start

### Prerequisites
- Node.js 16+ 
- Telegram Bot Token (from @BotFather)
- Telegram User ID (from @userinfobot)

### Local Installation
```bash
# Clone the repository
git clone https://github.com/mrwasif-dev/TG-Help.git
cd TG-Help

# Install dependencies
npm install

# Create .env file (optional)
cp .env.example .env
# Edit .env with your credentials

# Start the bot
npm start
