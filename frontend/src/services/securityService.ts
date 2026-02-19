
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const LEGACY_PIN_KEY = 'user_pin';
const LEGACY_BIOMETRICS_ENABLED_KEY = 'biometrics_enabled';
const PIN_KEY_PREFIX = 'user_pin_v2';
const BIOMETRICS_ENABLED_KEY_PREFIX = 'biometrics_enabled_v2';
const PIN_HASH_PREFIX = 'sha256:';

const getPinKey = (userId?: string) => userId ? `${PIN_KEY_PREFIX}:${userId}` : PIN_KEY_PREFIX;
const getBiometricKey = (userId?: string) => userId ? `${BIOMETRICS_ENABLED_KEY_PREFIX}:${userId}` : BIOMETRICS_ENABLED_KEY_PREFIX;

const getStoredPinRecord = async (userId?: string): Promise<{ key: string; value: string } | null> => {
    const scopedKey = getPinKey(userId);
    const scopedPin = await SecureStore.getItemAsync(scopedKey);
    if (scopedPin) {
        return { key: scopedKey, value: scopedPin };
    }

    const legacyPin = await SecureStore.getItemAsync(LEGACY_PIN_KEY);
    if (legacyPin) {
        return { key: LEGACY_PIN_KEY, value: legacyPin };
    }

    return null;
};

const hashPinValue = async (pin: string) => {
    const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin
    );
    return `${PIN_HASH_PREFIX}${digest}`;
};

export const securityService = {
    /**
     * Check if hardware supports biometrics
     */
    async checkHardwareSupport(): Promise<boolean> {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        return compatible && enrolled;
    },

    /**
     * Get available biometric types (FaceID, TouchID, etc.)
     */
    async getBiometricTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
        return await LocalAuthentication.supportedAuthenticationTypesAsync();
    },

    /**
     * Authenticate with biometrics
     */
    async authenticateBiometrics(): Promise<boolean> {
        const hasHardware = await this.checkHardwareSupport();
        if (!hasHardware) return false;

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Odblokuj aplikację',
            fallbackLabel: 'Użyj PIN-u',
            cancelLabel: 'Anuluj',
            disableDeviceFallback: true,
        });

        return result.success;
    },

    /**
     * Set a new PIN securely
     */
    async setPin(pin: string, userId?: string): Promise<void> {
        const pinKey = getPinKey(userId);
        const hashedPin = await hashPinValue(pin);
        await SecureStore.setItemAsync(pinKey, hashedPin);
        if (userId) {
            await SecureStore.deleteItemAsync(LEGACY_PIN_KEY);
        }
    },

    /**
     * Verify entered PIN against stored PIN
     */
    async verifyPin(pin: string, userId?: string): Promise<boolean> {
        const pinRecord = await getStoredPinRecord(userId);
        if (!pinRecord) return false;

        const currentKey = getPinKey(userId);
        const { key, value } = pinRecord;

        if (value.startsWith(PIN_HASH_PREFIX)) {
            const hashedPin = await hashPinValue(pin);
            const isValid = value === hashedPin;
            if (isValid && key !== currentKey) {
                await SecureStore.setItemAsync(currentKey, hashedPin);
                await SecureStore.deleteItemAsync(key);
            }
            return isValid;
        }

        const isLegacyMatch = value === pin;
        if (isLegacyMatch) {
            await this.setPin(pin, userId);
            if (key !== currentKey) {
                await SecureStore.deleteItemAsync(key);
            }
        }
        return isLegacyMatch;
    },

    /**
     * Check if a PIN is set
     */
    async hasPin(userId?: string): Promise<boolean> {
        const pinRecord = await getStoredPinRecord(userId);
        return !!pinRecord?.value;
    },

    /**
     * Delete PIN (disable security)
     */
    async removePin(userId?: string): Promise<void> {
        await SecureStore.deleteItemAsync(getPinKey(userId));
        await SecureStore.deleteItemAsync(LEGACY_PIN_KEY);
        await this.setBiometricsEnabled(false, userId);
    },

    /**
     * Enable/Disable biometrics preference
     */
    async setBiometricsEnabled(enabled: boolean, userId?: string): Promise<void> {
        await SecureStore.setItemAsync(getBiometricKey(userId), JSON.stringify(enabled));
        if (userId) {
            await SecureStore.deleteItemAsync(LEGACY_BIOMETRICS_ENABLED_KEY);
        }
    },

    /**
     * Check if biometrics is enabled by user
     */
    async isBiometricsEnabled(userId?: string): Promise<boolean> {
        const scopedKey = getBiometricKey(userId);
        const scopedValue = await SecureStore.getItemAsync(scopedKey);
        if (scopedValue !== null) {
            return scopedValue === 'true';
        }

        const legacyValue = await SecureStore.getItemAsync(LEGACY_BIOMETRICS_ENABLED_KEY);
        if (legacyValue === null) {
            return false;
        }

        if (userId) {
            await SecureStore.setItemAsync(scopedKey, legacyValue);
            await SecureStore.deleteItemAsync(LEGACY_BIOMETRICS_ENABLED_KEY);
        }
        return legacyValue === 'true';
    },
};
