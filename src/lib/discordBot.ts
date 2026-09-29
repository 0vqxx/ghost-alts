/**
 * Discord Bot Delivery Express Dispatcher
 * Sends automated delivery Direct Messages (DMs) to linked Discord accounts upon payment confirmation.
 */

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const DISCORD_API_BASE = 'https://discord.com/api/v10';

interface DiscordDeliveryParams {
  discordUserId: string;
  orderNumber: string;
  productName: string;
  quantity?: number;
  email: string;
  password?: string;
  token?: string | null;
  deliveredAt?: Date | number;
}

export async function sendDiscordDeliveryMessage({
  discordUserId,
  orderNumber,
  productName,
  quantity = 1,
  email,
  password = '••••••••',
  token,
  deliveredAt = new Date(),
}: DiscordDeliveryParams): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!discordUserId || !discordUserId.trim()) {
    console.warn('[Discord Bot] Cannot send delivery DM: No discordUserId provided.');
    return { success: false, error: 'No discordUserId provided' };
  }

  const cleanUserId = discordUserId.trim();
  const unixTimestamp = Math.floor(
    (deliveredAt instanceof Date ? deliveredAt.getTime() : deliveredAt) / 1000
  );

  // Format token line only if a token was provided
  const tokenLine = token && token.trim() ? `Token: ${token.trim()}\n` : '';

  const messageText = `Delivery Express | https://ghostalts.shop
Thanks for your purchase! Your order has been successfully processed and delivered.

Order Details
- Order ID: #${orderNumber}
- Product: ${productName}
- Quantity: ${quantity}
- Status: ✅ Delivered
- Delivered: <t:${unixTimestamp}:R>

Your Product
Email: ${email}
Password: ${password}
${tokenLine}
⚠️ Keep your delivery details private.
If anything is wrong with your order, click Open Support below.
[ 🛠️ Open Support ](https://ghostalts.shop/support)`;

  const authHeaders = [
    `Bot ${DISCORD_BOT_TOKEN}`,
    DISCORD_BOT_TOKEN,
  ];

  for (const authHeader of authHeaders) {
    try {
      // Step 1: Open DM channel with user
      const dmChannelRes = await fetch(`${DISCORD_API_BASE}/users/@me/channels`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipient_id: cleanUserId }),
      });

      if (!dmChannelRes.ok) {
        const errText = await dmChannelRes.text();
        console.warn(`[Discord Bot] DM channel open failed with auth header format: ${errText}`);
        continue;
      }

      const dmChannel = await dmChannelRes.json();
      const channelId = dmChannel.id;

      if (!channelId) {
        console.warn('[Discord Bot] No channelId returned from Discord API');
        continue;
      }

      // Step 2: Send message to DM channel
      const msgRes = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageText,
        }),
      });

      if (!msgRes.ok) {
        const errText = await msgRes.text();
        console.error(`[Discord Bot] Failed to send DM message to ${channelId}:`, errText);
        return { success: false, error: errText };
      }

      const msgData = await msgRes.json();
      console.log(`[Discord Bot] Successfully delivered order #${orderNumber} to Discord user ${cleanUserId}! Message ID: ${msgData.id}`);
      return { success: true, messageId: msgData.id };
    } catch (err: any) {
      console.error('[Discord Bot] Error sending delivery DM:', err);
    }
  }

  return { success: false, error: 'Could not deliver DM via Discord API' };
}
