const { Expo } = require('expo-server-sdk');
const expo = new Expo();

const sendPushNotification = async (pushToken, { title, body, data = {} }) => {
  if (!pushToken || !Expo.isExpoPushToken(pushToken)) return;
  try {
    const [ticket] = await expo.sendPushNotificationsAsync([{
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    }]);
    if (ticket.status === 'error') console.error('Push error:', ticket.message);
  } catch (err) {
    console.error('Push notification failed:', err.message);
  }
};

module.exports = { sendPushNotification };
