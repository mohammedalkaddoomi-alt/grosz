import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const notificationService = {
    parseDateInput(date: string) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return new Date(`${date}T09:00:00`);
        }
        return new Date(date);
    },

    async registerForPushNotificationsAsync() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return;
        }

        return true;
    },

    async scheduleSubscriptionReminder(id: string, name: string, date: string, daysBefore: number) {
        const granted = await this.registerForPushNotificationsAsync();
        if (!granted) {
            return;
        }

        // Cancel existing notification for this subscription if any
        await this.cancelSubscriptionReminder(id);

        const paymentDate = this.parseDateInput(date);
        const triggerDate = new Date(paymentDate);
        triggerDate.setDate(paymentDate.getDate() - daysBefore);
        triggerDate.setHours(9, 0, 0, 0); // Remind at 9:00 AM

        // If the date is in the past, schedule for next cycle (simplified)
        // In a real app, you'd calculate the next occurrence based on billing cycle
        if (triggerDate.getTime() <= Date.now()) {
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Przypomnienie o subskrypcji',
                body: `${name} odnawia się za ${daysBefore} ${daysBefore === 1 ? 'dzień' : 'dni'}.`,
                data: { subscriptionId: id },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
            },
            identifier: id,
        });
    },

    async cancelSubscriptionReminder(id: string) {
        await Notifications.cancelScheduledNotificationAsync(id);
    },

    async getAllScheduledNotifications() {
        return await Notifications.getAllScheduledNotificationsAsync();
    }
};
