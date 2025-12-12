// src/utils/smsSender.js
const Twilio = require('twilio');

const SMS_DISABLED = String(process.env.SMS_DISABLED || 'false').toLowerCase() === 'true';

let twilioClient = null;
function getClient() {
  if (twilioClient) return twilioClient;
  if (SMS_DISABLED) {
    // noop client
    twilioClient = {
      messages: {
        create: async (opts) => {
          console.log('[smsSender] SMS_DISABLED=true — skipping send', opts);
          return { disabled: true };
        }
      }
    };
    return twilioClient;
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error('smsSender: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in env');
  }
  twilioClient = Twilio(sid, token);
  return twilioClient;
}

/**
 * sendSms({ to, body, from })
 * Returns Twilio message resource or throws.
 */
async function sendSms({ to, body, from }) {
  if (!to) throw new Error('smsSender: "to" is required');
  if (!body) throw new Error('smsSender: "body" is required');

  const client = getClient();
  const opts = {
    to,
    from: from || process.env.TWILIO_FROM,
    body,
  };

  if (!opts.from && !SMS_DISABLED) {
    throw new Error('smsSender: TWILIO_FROM (sender) is not configured in env');
  }

  // simple send; Twilio SDK has its own retries in networking layer; if needed implement retry wrapper
  try {
    const message = await client.messages.create(opts);
    return message;
  } catch (err) {
    console.error('[smsSender] send failed:', err && err.message || err);
    throw err;
  }
}

module.exports = sendSms;
