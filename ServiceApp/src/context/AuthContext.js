import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ASSIGNABLE_SCREEN_ROUTES,
  SCREEN_REGISTRY,
  SUPERVISOR_SCREEN_ROUTES,
  getScreenMeta,
} from '../constants/screenRegistry';

const STORAGE_KEYS = {
  EXECUTIVES: '@smartSuite:executives',
  CURRENT_USER: '@smartSuite:currentUser',
  FORM_DRAFT_PREFIX: '@smartSuite:formDraft:',
};

const SUPERVISOR_CREDENTIALS = {
  username: 'Supervisor',
  password: 'Admin',
  databaseName: 'CrystalCopier',
};

const DEFAULT_EXECUTIVES = [
  {
    id: 'exec-demo',
    name: 'Demo Executive',
    username: 'user',
    password: '1',
    databaseName: 'CrystalCopier',
    assignedScreens: ['EmployeeSaleInvoice', 'CashReceipts'],
  },
];

const AuthContext = createContext(null);

const sanitizeScreens = (screens = []) =>
  screens.filter((route) => ASSIGNABLE_SCREEN_ROUTES.includes(route));

const normalizeValue = (value) => (value || '').trim();

export const AuthProvider = ({ children }) => {
  const [executives, setExecutives] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      try {
        const [storedExecutives, storedUser] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.EXECUTIVES),
          AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER),
        ]);

        if (!isMounted) return;

        if (storedExecutives) {
          setExecutives(JSON.parse(storedExecutives));
        } else {
          setExecutives(DEFAULT_EXECUTIVES);
        }

        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.warn('Auth bootstrap failed', error);
        if (isMounted) {
          setExecutives(DEFAULT_EXECUTIVES);
        }
      } finally {
        if (isMounted) {
          setHydrated(true);
          setLoading(false);
        }
      }
    };

    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEYS.EXECUTIVES,
      JSON.stringify(executives)
    ).catch((error) => console.warn('Saving executives failed', error));
  }, [executives, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (!currentUser) {
      AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER).catch((error) =>
        console.warn('Clearing user failed', error)
      );
      return;
    }
    AsyncStorage.setItem(
      STORAGE_KEYS.CURRENT_USER,
      JSON.stringify(currentUser)
    ).catch((error) => console.warn('Saving user failed', error));
  }, [currentUser, hydrated]);

  const getSupervisorScreens = useCallback(
    () => [...new Set(SUPERVISOR_SCREEN_ROUTES)],
    []
  );

  const login = useCallback(
    async ({ databaseName, username, password }) => {
      const normalizedDb = normalizeValue(databaseName).toLowerCase();
      const normalizedUsername = normalizeValue(username);
      const normalizedPassword = normalizeValue(password);

      if (!normalizedDb || !normalizedUsername || !normalizedPassword) {
        throw new Error('Enter database name, username and password.');
      }

      const supervisorMatch =
        normalizedUsername.toLowerCase() ===
          SUPERVISOR_CREDENTIALS.username.toLowerCase() &&
        normalizedPassword === SUPERVISOR_CREDENTIALS.password &&
        normalizedDb === SUPERVISOR_CREDENTIALS.databaseName.toLowerCase();

      if (supervisorMatch) {
        const user = {
          role: 'supervisor',
          username: SUPERVISOR_CREDENTIALS.username,
          databaseName: SUPERVISOR_CREDENTIALS.databaseName,
          assignedScreens: getSupervisorScreens(),
        };
        setCurrentUser(user);
        return user;
      }

      const executive = executives.find(
        (exec) =>
          exec.username.toLowerCase() === normalizedUsername.toLowerCase() &&
          exec.password === normalizedPassword &&
          exec.databaseName.toLowerCase() === normalizedDb
      );

      if (!executive) {
        throw new Error('Invalid executive credentials or database.');
      }

      const user = {
        role: 'executive',
        username: executive.username,
        databaseName: executive.databaseName,
        assignedScreens: sanitizeScreens(executive.assignedScreens),
        executiveId: executive.id,
      };

      setCurrentUser(user);
      return user;
    },
    [executives, getSupervisorScreens]
  );

  const logout = useCallback(async () => {
    setCurrentUser(null);
  }, []);

  const addExecutive = useCallback(
    async (payload) => {
      const username = normalizeValue(payload.username);
      const databaseName = normalizeValue(payload.databaseName);
      const password = normalizeValue(payload.password);

      if (!username || !databaseName || !password) {
        throw new Error('Username, database name and password are required.');
      }

      const exists = executives.some(
        (exec) => exec.username.toLowerCase() === username.toLowerCase()
      );
      if (exists) {
        throw new Error('Username already exists.');
      }

      const entity = {
        id: payload.id || `exec-${Date.now()}`,
        name: payload.name || username,
        username,
        password,
        databaseName,
        assignedScreens: sanitizeScreens(payload.assignedScreens),
      };

      setExecutives((prev) => [...prev, entity]);
      return entity;
    },
    [executives]
  );

  const updateExecutive = useCallback((id, updates) => {
    setExecutives((prev) =>
      prev.map((exec) => {
        if (exec.id !== id) return exec;
        return {
          ...exec,
          ...updates,
          assignedScreens: sanitizeScreens(updates.assignedScreens || exec.assignedScreens),
        };
      })
    );

    setCurrentUser((prev) => {
      if (!prev || prev.role !== 'executive' || prev.executiveId !== id) {
        return prev;
      }
      return {
        ...prev,
        assignedScreens: sanitizeScreens(
          updates.assignedScreens || prev.assignedScreens
        ),
      };
    });
  }, []);

  const deleteExecutive = useCallback((id) => {
    setExecutives((prev) => prev.filter((exec) => exec.id !== id));
    setCurrentUser((prev) => {
      if (prev?.role === 'executive' && prev.executiveId === id) {
        return null;
      }
      return prev;
    });
  }, []);

  const hasAccessToScreen = useCallback(
    (routeName) => {
      if (!currentUser) return false;
      if (currentUser.role === 'supervisor') return true;
      return currentUser.assignedScreens?.includes(routeName);
    },
    [currentUser]
  );

  const getAccessibleScreens = useCallback(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'supervisor') {
      return getSupervisorScreens();
    }
    return sanitizeScreens(currentUser.assignedScreens);
  }, [currentUser, getSupervisorScreens]);

  const saveFormDraft = useCallback(
    async (screenKey, formData) => {
      if (!currentUser) {
        throw new Error('Sign in to save your work.');
      }
      if (!screenKey) {
        throw new Error('Screen identifier missing.');
      }
      const payload = {
        data: formData,
        savedAt: new Date().toISOString(),
        screenKey,
        user: currentUser.username,
        role: currentUser.role,
      };
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.FORM_DRAFT_PREFIX}${currentUser.username}:${screenKey}`,
        JSON.stringify(payload)
      );
      return payload;
    },
    [currentUser]
  );

  const value = useMemo(
    () => ({
      loading,
      currentUser,
      executives,
      screenRegistry: SCREEN_REGISTRY,
      assignableScreens: ASSIGNABLE_SCREEN_ROUTES,
      login,
      logout,
      addExecutive,
      updateExecutive,
      deleteExecutive,
      hasAccessToScreen,
      getAccessibleScreens,
      saveFormDraft,
      getScreenMeta,
    }),
    [
      loading,
      currentUser,
      executives,
      login,
      logout,
      addExecutive,
      updateExecutive,
      deleteExecutive,
      hasAccessToScreen,
      getAccessibleScreens,
      saveFormDraft,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};


