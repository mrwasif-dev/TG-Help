const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// ===== BOT CONFIGURATION =====
const BOT_TOKEN = process.env.BOT_TOKEN || '8395607834:AAE7IJEt1xVs4-WzJxcntAfMES3IcpRnjtg';
const ADMIN_ID = process.env.ADMIN_ID || '6012422087';

const bot = new Telegraf(BOT_TOKEN);

// ===== DATABASE =====
const DATA_FILE = './support_tickets.json';
let tickets = {};

// Load existing tickets
if (fs.existsSync(DATA_FILE)) {
    try {
        tickets = JSON.parse(fs.readFileSync(DATA_FILE));
    } catch (error) {
        console.log('Error loading tickets:', error.message);
        tickets = {};
    }
}

// Save tickets to file
function saveTickets() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tickets, null, 2));
}

// ===== SESSIONS =====
const sessions = {};
const activeChats = {}; // Store active chat sessions: { ticketId: { userId, adminId } }

// ===== UTILITY FUNCTIONS =====

// Get current Pakistan date and time
function getCurrentDateTime() {
    const d = new Date();
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const pakistanTime = new Date(utc + 5 * 60 * 60 * 1000);

    const date = `${String(pakistanTime.getDate()).padStart(2,'0')}-${String(pakistanTime.getMonth()+1).padStart(2,'0')}-${pakistanTime.getFullYear()}`;
    const time = `${String(pakistanTime.getHours()).padStart(2,'0')}:${String(pakistanTime.getMinutes()).padStart(2,'0')}:${String(pakistanTime.getSeconds()).padStart(2,'0')}`;

    return { date, time };
}

// Generate unique ticket ID
function generateTicketId() {
    return 'TICKET_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

// ===== START COMMAND =====
bot.start(async (ctx) => {
    const chatId = ctx.chat.id;
    
    // Check if admin
    if (chatId.toString() === ADMIN_ID.toString()) {
        return ctx.reply(
            '👑 *Support Chat Admin Panel* 👑\n\nSelect an option:',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('📋 Pending Requests', 'adminPendingRequests')],
                    [Markup.button.callback('💬 Active Chats', 'adminActiveChats')],
                    [Markup.button.callback('📊 All Tickets', 'adminAllTickets')],
                    [Markup.button.callback('📈 Stats', 'adminStats')]
                ])
            }
        );
    }

    // Regular user - show support options
    await ctx.reply(
        '👋 *Welcome to Paid WhatsApp Bot Support Chat!*\n\nHow can I help you today?',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('✅ Account Issues', 'issue_account')],
                [Markup.button.callback('✅ Deposit/Withdrawal Problems', 'issue_deposit')],
                [Markup.button.callback('✅ Bot Setup Assistance', 'issue_setup')],
                [Markup.button.callback('✅ Technical Support', 'issue_technical')],
                [Markup.button.callback('✅ General Inquiries', 'issue_general')],
                [Markup.button.callback('📞 Other Issues', 'issue_other')]
            ])
        }
    );
});

// ===== ISSUE SELECTION HANDLERS =====

// Account Issues
bot.action('issue_account', async (ctx) => {
    await createSupportRequest(ctx, 'Account Issues');
});

// Deposit/Withdrawal Problems
bot.action('issue_deposit', async (ctx) => {
    await createSupportRequest(ctx, 'Deposit/Withdrawal Problems');
});

// Bot Setup Assistance
bot.action('issue_setup', async (ctx) => {
    await createSupportRequest(ctx, 'Bot Setup Assistance');
});

// Technical Support
bot.action('issue_technical', async (ctx) => {
    await createSupportRequest(ctx, 'Technical Support');
});

// General Inquiries
bot.action('issue_general', async (ctx) => {
    await createSupportRequest(ctx, 'General Inquiries');
});

// Other Issues
bot.action('issue_other', async (ctx) => {
    await createSupportRequest(ctx, 'Other Issues');
});

// ===== CREATE SUPPORT REQUEST =====
async function createSupportRequest(ctx, issueType) {
    const userId = ctx.chat.id;
    const username = ctx.from.username || ctx.from.first_name;
    const { date, time } = getCurrentDateTime();
    
    // Generate ticket ID
    const ticketId = generateTicketId();
    
    // Create ticket
    tickets[ticketId] = {
        id: ticketId,
        userId: userId,
        username: username,
        issueType: issueType,
        status: 'pending',
        createdAt: `${date} ${time}`,
        messages: [],
        adminAction: null,
        adminActionTime: null
    };
    
    // Save to database
    saveTickets();
    
    // Notify user
    await ctx.reply(
        `✅ *Support Request Sent!*\n\n` +
        `📋 *Ticket Details:*\n` +
        `• Ticket ID: ${ticketId}\n` +
        `• Issue Type: ${issueType}\n` +
        `• Status: ⏳ Pending Admin Approval\n\n` +
        `📞 You will be notified when admin responds.`,
        { parse_mode: 'Markdown' }
    );
    
    // Notify admin with Approve/Reject buttons
    const adminMessage = 
        `🆕 *NEW SUPPORT REQUEST* 🆕\n\n` +
        `🎫 *Ticket ID:* ${ticketId}\n` +
        `👤 *User:* ${username} (ID: ${userId})\n` +
        `📌 *Issue Type:* ${issueType}\n` +
        `📅 *Created:* ${date} at ${time}\n\n` +
        `⚠️ *Action Required:*`;
    
    await bot.telegram.sendMessage(
        ADMIN_ID,
        adminMessage,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('✅ Approve & Start Chat', `admin_approve_${ticketId}`)],
                [Markup.button.callback('❌ Reject Request', `admin_reject_${ticketId}`)]
            ])
        }
    );
}

// ===== ADMIN APPROVE TICKET =====
bot.action(/admin_approve_(TICKET_\d+_\d+)/, async (ctx) => {
    const ticketId = ctx.match[1];
    const ticket = tickets[ticketId];
    
    if (!ticket) {
        return ctx.answerCbQuery('Ticket not found!', { show_alert: true });
    }
    
    const { date, time } = getCurrentDateTime();
    
    // Update ticket status
    ticket.status = 'approved';
    ticket.adminAction = 'approved';
    ticket.adminActionTime = `${date} ${time}`;
    ticket.adminId = ctx.chat.id;
    
    // Create active chat session
    activeChats[ticketId] = {
        userId: ticket.userId,
        adminId: ctx.chat.id,
        startedAt: `${date} ${time}`
    };
    
    saveTickets();
    
    // Notify user
    await bot.telegram.sendMessage(
        ticket.userId,
        `🎉 *Support Request Approved!*\n\n` +
        `✅ Your support request has been approved.\n` +
        `🎫 Ticket ID: ${ticketId}\n` +
        `📌 Issue: ${ticket.issueType}\n` +
        `👑 Admin is now available to chat.\n\n` +
        `💬 *You can start chatting now!*\n` +
        `Type your message and I'll forward it to admin.`,
        { parse_mode: 'Markdown' }
    );
    
    // Update admin message
    await ctx.editMessageText(
        `✅ *Chat Session Started* ✅\n\n` +
        `🎫 Ticket ID: ${ticketId}\n` +
        `👤 User: ${ticket.username}\n` +
        `📌 Issue: ${ticket.issueType}\n` +
        `🕐 Started: ${date} at ${time}\n\n` +
        `💬 *You are now connected with the user.*\n` +
        `Type your messages below.\n\n` +
        `⚠️ *Important:* User messages will appear here.`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('🚪 End Chat Session', `admin_end_chat_${ticketId}`)],
                [Markup.button.callback('📋 View Ticket Info', `admin_view_ticket_${ticketId}`)]
            ])
        }
    );
    
    // Send welcome message to admin
    await ctx.reply(
        `💬 *Chat Session Active*\n\n` +
        `You are now chatting with ${ticket.username}\n` +
        `Ticket: ${ticketId}\n` +
        `Issue: ${ticket.issueType}\n\n` +
        `✍️ Type your messages here.\n` +
        `📤 I'll forward them to the user.`,
        { parse_mode: 'Markdown' }
    );
});

// ===== ADMIN REJECT TICKET =====
bot.action(/admin_reject_(TICKET_\d+_\d+)/, async (ctx) => {
    const ticketId = ctx.match[1];
    const ticket = tickets[ticketId];
    
    if (!ticket) {
        return ctx.answerCbQuery('Ticket not found!', { show_alert: true });
    }
    
    // Ask admin for rejection reason
    sessions[ctx.chat.id] = {
        flow: 'admin_reject_reason',
        ticketId: ticketId
    };
    
    await ctx.answerCbQuery();
    await ctx.reply(
        `❌ *Reject Support Request*\n\n` +
        `Ticket ID: ${ticketId}\n` +
        `User: ${ticket.username}\n` +
        `Issue: ${ticket.issueType}\n\n` +
        `📝 Please enter the reason for rejection:`,
        { parse_mode: 'Markdown' }
    );
});

// ===== ADMIN END CHAT =====
bot.action(/admin_end_chat_(TICKET_\d+_\d+)/, async (ctx) => {
    const ticketId = ctx.match[1];
    const ticket = tickets[ticketId];
    
    if (!ticket) {
        return ctx.answerCbQuery('Ticket not found!', { show_alert: true });
    }
    
    const { date, time } = getCurrentDateTime();
    
    // Update ticket status
    ticket.status = 'closed';
    ticket.closedAt = `${date} ${time}`;
    ticket.closedBy = 'admin';
    
    // Remove from active chats
    delete activeChats[ticketId];
    
    saveTickets();
    
    // Notify user
    await bot.telegram.sendMessage(
        ticket.userId,
        `📞 *Chat Session Ended*\n\n` +
        `🚪 Admin has ended the chat session.\n` +
        `🎫 Ticket ID: ${ticketId}\n` +
        `🕐 Closed: ${date} at ${time}\n\n` +
        `🙏 Thank you for using our support service!\n` +
        `If you need further assistance, please create a new support request.`,
        { parse_mode: 'Markdown' }
    );
    
    // Notify admin
    await ctx.editMessageText(
        `🚪 *Chat Session Ended* 🚪\n\n` +
        `✅ Successfully closed chat session.\n` +
        `🎫 Ticket ID: ${ticketId}\n` +
        `👤 User: ${ticket.username}\n` +
        `🕐 Closed: ${date} at ${time}\n\n` +
        `📊 Total messages exchanged: ${ticket.messages ? ticket.messages.length : 0}`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('📋 View All Tickets', 'adminAllTickets')],
                [Markup.button.callback('🔄 New Requests', 'adminPendingRequests')]
            ])
        }
    );
    
    // Send confirmation to admin
    await ctx.reply(
        `✅ Chat session with ${ticket.username} has been closed.`,
        { parse_mode: 'Markdown' }
    );
});

// ===== ADMIN VIEW TICKET =====
bot.action(/admin_view_ticket_(TICKET_\d+_\d+)/, async (ctx) => {
    const ticketId = ctx.match[1];
    const ticket = tickets[ticketId];
    
    if (!ticket) {
        return ctx.answerCbQuery('Ticket not found!', { show_alert: true });
    }
    
    let message = `📋 *Ticket Information* 📋\n\n`;
    message += `🎫 *Ticket ID:* ${ticket.id}\n`;
    message += `👤 *User:* ${ticket.username} (ID: ${ticket.userId})\n`;
    message += `📌 *Issue Type:* ${ticket.issueType}\n`;
    message += `📊 *Status:* ${ticket.status}\n`;
    message += `📅 *Created:* ${ticket.createdAt}\n`;
    
    if (ticket.adminAction) {
        message += `👑 *Admin Action:* ${ticket.adminAction}\n`;
        message += `🕐 *Action Time:* ${ticket.adminActionTime}\n`;
    }
    
    if (ticket.closedAt) {
        message += `🚪 *Closed:* ${ticket.closedAt}\n`;
        message += `📝 *Closed By:* ${ticket.closedBy}\n`;
    }
    
    message += `\n💬 *Messages:* ${ticket.messages ? ticket.messages.length : 0}`;
    
    await ctx.reply(
        message,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('🔙 Back to Chat', `admin_back_chat_${ticketId}`)],
                [Markup.button.callback('📜 View Messages', `admin_view_messages_${ticketId}`)],
                ticket.status === 'approved' ? 
                    [Markup.button.callback('🚪 End Chat', `admin_end_chat_${ticketId}`)] : []
            ])
        }
    );
});

// ===== ADMIN BACK TO CHAT =====
bot.action(/admin_back_chat_(TICKET_\d+_\d+)/, async (ctx) => {
    const ticketId = ctx.match[1];
    const ticket = tickets[ticketId];
    
    if (!ticket) {
        return ctx.answerCbQuery('Ticket not found!', { show_alert: true });
    }
    
    await ctx.editMessageText(
        `💬 *Chat Session Active*\n\n` +
        `You are chatting with ${ticket.username}\n` +
        `Ticket: ${ticketId}\n` +
        `Issue: ${ticket.issueType}\n\n` +
        `✍️ Type your messages here.\n` +
        `📤 I'll forward them to the user.`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('🚪 End Chat Session', `admin_end_chat_${ticketId}`)],
                [Markup.button.callback('📋 View Ticket Info', `admin_view_ticket_${ticketId}`)]
            ])
        }
    );
});

// ===== ADMIN PANEL BUTTONS =====

// Pending Requests
bot.action('adminPendingRequests', async (ctx) => {
    const pendingTickets = Object.values(tickets).filter(t => t.status === 'pending');
    
    if (pendingTickets.length === 0) {
        return ctx.reply(
            '📭 *No Pending Requests*\n\nThere are no pending support requests.',
            { parse_mode: 'Markdown' }
        );
    }
    
    let message = `📋 *Pending Support Requests (${pendingTickets.length})* 📋\n\n`;
    
    pendingTickets.forEach((ticket, index) => {
        message += `${index + 1}. ${ticket.issueType}\n`;
        message += `   👤 ${ticket.username}\n`;
        message += `   🎫 ${ticket.id}\n`;
        message += `   📅 ${ticket.createdAt}\n\n`;
    });
    
    // Create buttons for each pending ticket
    const buttons = pendingTickets.slice(0, 5).map(ticket => [
        Markup.button.callback(`👤 ${ticket.username} - ${ticket.issueType}`, `admin_view_pending_${ticket.id}`)
    ]);
    
    buttons.push([Markup.button.callback('🔙 Back to Admin Panel', 'backToAdminMenu')]);
    
    await ctx.reply(
        message,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
        }
    );
});

// View pending ticket
bot.action(/admin_view_pending_(TICKET_\d+_\d+)/, async (ctx) => {
    const ticketId = ctx.match[1];
    const ticket = tickets[ticketId];
    
    if (!ticket) {
        return ctx.answerCbQuery('Ticket not found!', { show_alert: true });
    }
    
    await ctx.reply(
        `📋 *Pending Request Details*\n\n` +
        `🎫 Ticket ID: ${ticket.id}\n` +
        `👤 User: ${ticket.username} (ID: ${ticket.userId})\n` +
        `📌 Issue: ${ticket.issueType}\n` +
        `📅 Created: ${ticket.createdAt}\n\n` +
        `⚠️ *Take Action:*`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('✅ Approve & Start Chat', `admin_approve_${ticketId}`)],
                [Markup.button.callback('❌ Reject Request', `admin_reject_${ticketId}`)],
                [Markup.button.callback('🔙 Back to Pending', 'adminPendingRequests')]
            ])
        }
    );
});

// Active Chats
bot.action('adminActiveChats', async (ctx) => {
    const activeTickets = Object.values(tickets).filter(t => t.status === 'approved');
    
    if (activeTickets.length === 0) {
        return ctx.reply(
            '💬 *No Active Chats*\n\nThere are no active chat sessions.',
            { parse_mode: 'Markdown' }
        );
    }
    
    let message = `💬 *Active Chat Sessions (${activeTickets.length})* 💬\n\n`;
    
    activeTickets.forEach((ticket, index) => {
        const chatSession = activeChats[ticket.id];
        message += `${index + 1}. ${ticket.username}\n`;
        message += `   🎫 ${ticket.id}\n`;
        message += `   📌 ${ticket.issueType}\n`;
        if (chatSession) {
            message += `   🕐 Started: ${chatSession.startedAt}\n`;
        }
        message += `\n`;
    });
    
    // Create buttons for each active chat
    const buttons = activeTickets.slice(0, 5).map(ticket => [
        Markup.button.callback(`💬 Chat with ${ticket.username}`, `admin_join_chat_${ticket.id}`)
    ]);
    
    buttons.push([Markup.button.callback('🔙 Back to Admin Panel', 'backToAdminMenu')]);
    
    await ctx.reply(
        message,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
        }
    );
});

// Join active chat
bot.action(/admin_join_chat_(TICKET_\d+_\d+)/, async (ctx) => {
    const ticketId = ctx.match[1];
    const ticket = tickets[ticketId];
    
    if (!ticket) {
        return ctx.answerCbQuery('Ticket not found!', { show_alert: true });
    }
    
    await ctx.editMessageText(
        `💬 *Chat Session Active*\n\n` +
        `You are chatting with ${ticket.username}\n` +
        `Ticket: ${ticketId}\n` +
        `Issue: ${ticket.issueType}\n\n` +
        `✍️ Type your messages here.\n` +
        `📤 I'll forward them to the user.`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('🚪 End Chat Session', `admin_end_chat_${ticketId}`)],
                [Markup.button.callback('📋 View Ticket Info', `admin_view_ticket_${ticketId}`)]
            ])
        }
    );
});

// All Tickets
bot.action('adminAllTickets', async (ctx) => {
    const allTickets = Object.values(tickets);
    
    if (allTickets.length === 0) {
        return ctx.reply(
            '📭 *No Tickets*\n\nThere are no support tickets yet.',
            { parse_mode: 'Markdown' }
        );
    }
    
    const pending = allTickets.filter(t => t.status === 'pending').length;
    const approved = allTickets.filter(t => t.status === 'approved').length;
    const closed = allTickets.filter(t => t.status === 'closed').length;
    
    await ctx.reply(
        `📊 *All Support Tickets* 📊\n\n` +
        `📈 *Statistics:*\n` +
        `⏳ Pending: ${pending}\n` +
        `💬 Active: ${approved}\n` +
        `✅ Closed: ${closed}\n` +
        `📊 Total: ${allTickets.length}\n\n` +
        `Select view option:`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('⏳ View Pending', 'adminPendingRequests')],
                [Markup.button.callback('💬 View Active', 'adminActiveChats')],
                [Markup.button.callback('✅ View Closed', 'adminClosedTickets')],
                [Markup.button.callback('🔙 Back to Admin Panel', 'backToAdminMenu')]
            ])
        }
    );
});

// Stats
bot.action('adminStats', async (ctx) => {
    const allTickets = Object.values(tickets);
    const today = new Date().toDateString();
    
    const todayTickets = allTickets.filter(t => {
        const ticketDate = new Date(t.createdAt.split(' ')[0].split('-').reverse().join('-')).toDateString();
        return ticketDate === today;
    }).length;
    
    await ctx.reply(
        `📈 *Support System Statistics* 📈\n\n` +
        `📊 *Overall:*\n` +
        `• Total Tickets: ${allTickets.length}\n` +
        `• Active Chats: ${Object.keys(activeChats).length}\n` +
        `• Today's Tickets: ${todayTickets}\n\n` +
        `📅 *Status Breakdown:*\n` +
        `⏳ Pending: ${allTickets.filter(t => t.status === 'pending').length}\n` +
        `💬 Active: ${allTickets.filter(t => t.status === 'approved').length}\n` +
        `✅ Closed: ${allTickets.filter(t => t.status === 'closed').length}\n\n` +
        `👤 *Top Issues:*\n` +
        getTopIssues(allTickets),
        { parse_mode: 'Markdown' }
    );
});

function getTopIssues(tickets) {
    const issueCount = {};
    tickets.forEach(ticket => {
        issueCount[ticket.issueType] = (issueCount[ticket.issueType] || 0) + 1;
    });
    
    const sortedIssues = Object.entries(issueCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    
    return sortedIssues.map(([issue, count], index) => 
        `${index + 1}. ${issue}: ${count}`
    ).join('\n');
}

// ===== TEXT MESSAGE HANDLING =====

bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text.trim();
    const { date, time } = getCurrentDateTime();
    
    // Check if admin is rejecting a ticket
    if (sessions[chatId] && sessions[chatId].flow === 'admin_reject_reason') {
        const { ticketId } = sessions[chatId];
        const ticket = tickets[ticketId];
        
        if (!ticket) {
            await ctx.reply('Ticket not found!');
            delete sessions[chatId];
            return;
        }
        
        // Update ticket status
        ticket.status = 'rejected';
        ticket.adminAction = 'rejected';
        ticket.adminActionTime = `${date} ${time}`;
        ticket.rejectionReason = text;
        
        saveTickets();
        
        // Notify user
        await bot.telegram.sendMessage(
            ticket.userId,
            `❌ *Support Request Rejected*\n\n` +
            `⚠️ Your support request has been rejected.\n` +
            `🎫 Ticket ID: ${ticketId}\n` +
            `📌 Issue: ${ticket.issueType}\n\n` +
            `📝 *Rejection Reason:*\n${text}\n\n` +
            `🙏 Thank you for contacting support.\n` +
            `You can create a new request if needed.`,
            { parse_mode: 'Markdown' }
        );
        
        // Notify admin
        await ctx.reply(
            `✅ *Request Rejected*\n\n` +
            `Successfully rejected support request.\n` +
            `Ticket: ${ticketId}\n` +
            `User: ${ticket.username}\n` +
            `Reason sent to user.`,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('📋 View All Tickets', 'adminAllTickets')]
                ])
            }
        );
        
        delete sessions[chatId];
        return;
    }
    
    // Check if message is from admin in active chat
    if (chatId.toString() === ADMIN_ID.toString()) {
        // Find active chat where admin is participating
        const activeTicketId = Object.keys(activeChats).find(ticketId => 
            activeChats[ticketId].adminId === chatId
        );
        
        if (activeTicketId) {
            const ticket = tickets[activeTicketId];
            if (ticket && ticket.status === 'approved') {
                // Store message
                if (!ticket.messages) ticket.messages = [];
                ticket.messages.push({
                    from: 'admin',
                    text: text,
                    time: `${date} ${time}`
                });
                
                saveTickets();
                
                // Forward to user
                await bot.telegram.sendMessage(
                    ticket.userId,
                    `👑 *Admin:* ${text}\n\n` +
                    `💬 *You can reply to this message.*`,
                    { parse_mode: 'Markdown' }
                );
                
                // Confirm to admin
                await ctx.reply(`✅ Message sent to ${ticket.username}`);
                return;
            }
        }
    } 
    // Check if message is from user in active chat
    else {
        // Find active chat where user is participating
        const activeTicketId = Object.keys(activeChats).find(ticketId => 
            activeChats[ticketId].userId === chatId
        );
        
        if (activeTicketId) {
            const ticket = tickets[activeTicketId];
            if (ticket && ticket.status === 'approved') {
                // Store message
                if (!ticket.messages) ticket.messages = [];
                ticket.messages.push({
                    from: 'user',
                    text: text,
                    time: `${date} ${time}`
                });
                
                saveTickets();
                
                // Forward to admin
                await bot.telegram.sendMessage(
                    ADMIN_ID,
                    `👤 *${ticket.username}:* ${text}\n\n` +
                    `🎫 Ticket: ${activeTicketId}\n` +
                    `💬 *Type your reply below.*`,
                    { parse_mode: 'Markdown' }
                );
                
                // Confirm to user
                await ctx.reply(`✅ Message sent to admin`);
                return;
            }
        }
    }
    
    // If no active chat and user sends message
    if (chatId.toString() !== ADMIN_ID.toString()) {
        await ctx.reply(
            `📞 *Please select a support option first*\n\n` +
            `Use /start to see available support options.`,
            { parse_mode: 'Markdown' }
        );
    }
});

// ===== BACK TO ADMIN MENU =====
bot.action('backToAdminMenu', async (ctx) => {
    if (ctx.chat.id.toString() !== ADMIN_ID.toString()) {
        return ctx.answerCbQuery('Admin access only!', { show_alert: true });
    }
    
    await ctx.editMessageText(
        '👑 *Support Chat Admin Panel* 👑\n\nSelect an option:',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('📋 Pending Requests', 'adminPendingRequests')],
                [Markup.button.callback('💬 Active Chats', 'adminActiveChats')],
                [Markup.button.callback('📊 All Tickets', 'adminAllTickets')],
                [Markup.button.callback('📈 Stats', 'adminStats')]
            ])
        }
    );
});

// ===== LAUNCH BOT =====
bot.launch().then(() => {
    console.log('✅ TG-Help Support Bot is running...');
    console.log('🤖 Bot Token:', BOT_TOKEN.substring(0, 10) + '...');
    console.log('👑 Admin ID:', ADMIN_ID);
    console.log('💾 Database file:', DATA_FILE);
    console.log('🚀 Ready to handle support tickets!');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Keep-alive for Heroku
setInterval(() => {
    console.log('🟢 Bot is alive and running...');
}, 60000); // Every minute
