import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

const formatTimestamp = (isoString) => {
  try {
    return new Date(isoString).toLocaleString();
  } catch (error) {
    return isoString;
  }
};

export const useScreenDraft = (
  screenKey,
  buildPayload,
  { successMessage } = {}
) => {
  const { saveFormDraft, currentUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (typeof buildPayload !== 'function') {
      Alert.alert('Save unavailable', 'Missing form data provider.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = buildPayload();
      const result = await saveFormDraft(screenKey, payload);
      const timestamp = formatTimestamp(result.savedAt);
      Alert.alert(
        'Draft saved',
        `${successMessage || 'Your progress is safe.'}\n${currentUser?.username || ''} • ${timestamp}`
      );
    } catch (error) {
      Alert.alert('Save failed', error.message || 'Unable to save right now.');
    } finally {
      setIsSaving(false);
    }
  }, [buildPayload, saveFormDraft, screenKey, successMessage, currentUser]);

  return { handleSave, isSaving };
};

export default useScreenDraft;


