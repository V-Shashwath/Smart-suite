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
import { API_ENDPOINTS, apiCall } from '../config/api';

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
          const parsedUser = JSON.parse(storedUser);
          // Validate stored user has required fields
          if (parsedUser && parsedUser.username && parsedUser.role) {
            console.log(`📱 Restored user from storage:`, {
              role: parsedUser.role,
              username: parsedUser.username,
              assignedScreens: parsedUser.assignedScreens,
            });
            setCurrentUser(parsedUser);
          } else {
            console.warn('⚠️ Invalid user data in storage, clearing...');
            AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER).catch(() => {});
          }
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
    // Validate user object before saving
    if (currentUser && currentUser.username && currentUser.role) {
      console.log(`💾 Saving user to storage:`, {
        role: currentUser.role,
        username: currentUser.username,
        assignedScreens: currentUser.assignedScreens,
      });
      AsyncStorage.setItem(
        STORAGE_KEYS.CURRENT_USER,
        JSON.stringify(currentUser)
      ).catch((error) => console.warn('Saving user failed', error));
    } else {
      console.warn('⚠️ Invalid user object, not saving to storage');
    }
  }, [currentUser, hydrated]);

  const getSupervisorScreens = useCallback(
    () => [...new Set(SUPERVISOR_SCREEN_ROUTES)],
    []
  );

  const login = useCallback(
    async ({ databaseName, username, password }) => {
      // Validate database name must be CrystalCopier
      const normalizedDb = normalizeValue(databaseName).toLowerCase();
      if (normalizedDb !== 'crystalcopier') {
        throw new Error('Database name must be "CrystalCopier"');
      }
      
      const normalizedUsername = normalizeValue(username);
      const normalizedPassword = normalizeValue(password);

      if (!normalizedDb || !normalizedUsername || !normalizedPassword) {
        throw new Error('Enter database name, username and password.');
      }

      // Clear any existing user before attempting login
      console.log(`🔐 Starting login process for: ${normalizedUsername}`);
      setCurrentUser(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER).catch(() => {});

      try {
        // Try employee authentication FIRST (employees are more common)
        // This ensures employees are treated as employees even if they exist in both tables
        try {
          console.log(`🔐 Attempting employee authentication for: ${normalizedUsername}`);
          const employeeResponse = await apiCall(API_ENDPOINTS.AUTHENTICATE_EMPLOYEE, {
            method: 'POST',
            body: JSON.stringify({
              username: normalizedUsername,
              password: normalizedPassword,
            }),
          });

          if (employeeResponse.success && employeeResponse.data) {
            const employee = employeeResponse.data;
            console.log(`✅ Employee authenticated: ${employee.username}`);
            
            // Use assigned screens from backend response (already fetched during authentication)
            // If assignedScreens is null, undefined, or empty array, use default
            let assignedScreens = [];
            if (employee.assignedScreens && Array.isArray(employee.assignedScreens) && employee.assignedScreens.length > 0) {
              assignedScreens = sanitizeScreens(employee.assignedScreens);
            } else {
              // Default to EmployeeSaleInvoice only if no screens assigned
              assignedScreens = sanitizeScreens(['EmployeeSaleInvoice']);
              console.log(`⚠️ No screens assigned for ${employee.username}, using default: EmployeeSaleInvoice`);
            }
            
            console.log(`📱 Assigned screens for ${employee.username}:`, assignedScreens);
            
            const user = {
              role: 'executive',
              username: employee.username,
              databaseName: normalizedDb,
              assignedScreens,
              executiveId: employee.employeeId,
              employeeName: employee.employeeName,
            };
            console.log(`👤 Setting current user:`, {
              role: user.role,
              username: user.username,
              assignedScreens: user.assignedScreens,
              executiveId: user.executiveId,
            });
            setCurrentUser(user);
            return user;
          } else {
            console.log(`⚠️ Employee authentication returned success=false for: ${normalizedUsername}`);
          }
        } catch (employeeError) {
          // Employee authentication failed - try supervisor authentication
          const is401Error = employeeError.message.includes('Invalid username or password') || 
                            employeeError.message.includes('401');
          if (is401Error) {
            console.log(`ℹ️ Employee authentication failed (401) for: ${normalizedUsername} - trying supervisor authentication`);
          } else {
            console.warn(`⚠️ Employee authentication error (non-401) for: ${normalizedUsername}:`, employeeError.message);
          }
        }

        // Try supervisor authentication (only if employee auth failed)
        try {
          console.log(`🔐 Attempting supervisor authentication for: ${normalizedUsername}`);
          const supervisorResponse = await apiCall(API_ENDPOINTS.AUTHENTICATE_SUPERVISOR, {
            method: 'POST',
            body: JSON.stringify({
              username: normalizedUsername,
              password: normalizedPassword,
            }),
          });

          if (supervisorResponse.success && supervisorResponse.data) {
            const supervisor = supervisorResponse.data;
            console.log(`✅ Supervisor authenticated: ${supervisor.username}`);
            
            // Fetch all executives with screen assignments from backend
            // Do this asynchronously after login succeeds to avoid blocking login
            setTimeout(async () => {
              try {
                const executivesResponse = await apiCall(API_ENDPOINTS.GET_ALL_EXECUTIVES_WITH_SCREENS);
                if (executivesResponse.success && executivesResponse.data) {
                  // Map backend data to frontend format
                  const backendExecutives = executivesResponse.data.map((exec) => ({
                    id: `exec-${exec.employeeId}`,
                    name: exec.employeeName || exec.username,
                    username: exec.username,
                    password: '', // Don't store password in frontend
                    databaseName: normalizedDb,
                    assignedScreens: exec.assignedScreens || [],
                    employeeId: exec.employeeId,
                  }));
                  setExecutives(backendExecutives);
                  console.log(`✅ Loaded ${backendExecutives.length} executives from backend`);
                }
              } catch (execError) {
                console.warn('⚠️ Could not load executives from backend:', execError.message);
                // Continue with empty executives list - don't block supervisor login
              }
            }, 100);
            
            const user = {
              role: 'supervisor',
              username: supervisor.username,
              databaseName: normalizedDb,
              assignedScreens: getSupervisorScreens(),
              supervisorId: supervisor.supervisorId,
            };
            console.log(`👤 Setting current user:`, {
              role: user.role,
              username: user.username,
              assignedScreens: user.assignedScreens,
              supervisorId: user.supervisorId,
            });
            setCurrentUser(user);
            return user;
          } else {
            console.log(`⚠️ Supervisor authentication returned success=false for: ${normalizedUsername}`);
          }
        } catch (supervisorError) {
          // Supervisor authentication also failed
          const is401Error = supervisorError.message.includes('Invalid username or password') || 
                            supervisorError.message.includes('401');
          if (is401Error) {
            console.log(`❌ Both employee and supervisor authentication failed for: ${normalizedUsername}`);
            console.log(`   Please check:`);
            console.log(`   1. Username is correct: "${normalizedUsername}"`);
            console.log(`   2. Password is correct`);
            console.log(`   3. User exists in Employees or Supervisors table`);
            console.log(`   4. Status is 'Active' (for supervisors)`);
          } else {
            console.error('❌ Supervisor authentication error:', supervisorError.message);
          }
        }

        // If both failed, throw error
        throw new Error('Invalid username or password. Please check your credentials and try again.');
      } catch (error) {
        // If it's already a user-friendly error, re-throw it
        if (error.message === 'Invalid username or password.' || 
            error.message.includes('Invalid') ||
            error.message.includes('credentials')) {
          throw error;
        }
        // Otherwise, wrap network errors
        throw new Error('Cannot connect to server. Please check your connection and try again.');
      }
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

      // Check if employee exists in database (by username)
      // Note: This assumes the employee is already created in Employees table
      // For now, we'll just update screen assignments
      // In a full implementation, you'd create the employee first, then assign screens
      
      // For now, we'll use the employeeId if provided, or try to find by username
      if (!payload.employeeId) {
        throw new Error('Employee must exist in database first. Please create employee in Employees table.');
      }

      // Set screen assignments via backend
      const assignedScreens = sanitizeScreens(payload.assignedScreens || []);
      try {
        const response = await apiCall(API_ENDPOINTS.SET_EXECUTIVE_SCREEN_ASSIGNMENTS, {
          method: 'POST',
          body: JSON.stringify({
            employeeId: payload.employeeId,
            assignedScreens,
            modifiedBy: currentUser?.username || 'System',
          }),
        });

        if (!response.success) {
          throw new Error(response.message || 'Failed to assign screens');
        }

        // Refresh executives list
        const executivesResponse = await apiCall(API_ENDPOINTS.GET_ALL_EXECUTIVES_WITH_SCREENS);
        if (executivesResponse.success && executivesResponse.data) {
          const backendExecutives = executivesResponse.data.map((exec) => ({
            id: `exec-${exec.employeeId}`,
            name: exec.employeeName || exec.username,
            username: exec.username,
            password: '',
            databaseName: databaseName || currentUser?.databaseName || 'CrystalCopier',
            assignedScreens: exec.assignedScreens || [],
            employeeId: exec.employeeId,
          }));
          setExecutives(backendExecutives);
        }

        return {
          id: `exec-${payload.employeeId}`,
          name: payload.name || username,
          username,
          password: '',
          databaseName,
          assignedScreens,
          employeeId: payload.employeeId,
        };
      } catch (error) {
        console.error('Error adding executive screen assignments:', error);
        throw error;
      }
    },
    [executives, currentUser]
  );

  const updateExecutive = useCallback(async (id, updates) => {
    // Find the executive to get employeeId
    const executive = executives.find((exec) => exec.id === id);
    if (!executive || !executive.employeeId) {
      throw new Error('Executive not found or missing employeeId');
    }

    // Update screen assignments via backend
    if (updates.assignedScreens !== undefined) {
      const assignedScreens = sanitizeScreens(updates.assignedScreens);
      try {
        const response = await apiCall(API_ENDPOINTS.SET_EXECUTIVE_SCREEN_ASSIGNMENTS, {
          method: 'POST',
          body: JSON.stringify({
            employeeId: executive.employeeId,
            assignedScreens,
            modifiedBy: currentUser?.username || 'System',
          }),
        });

        if (!response.success) {
          throw new Error(response.message || 'Failed to update screen assignments');
        }

        // Refresh executives list
        const executivesResponse = await apiCall(API_ENDPOINTS.GET_ALL_EXECUTIVES_WITH_SCREENS);
        if (executivesResponse.success && executivesResponse.data) {
          const backendExecutives = executivesResponse.data.map((exec) => ({
            id: `exec-${exec.employeeId}`,
            name: exec.employeeName || exec.username,
            username: exec.username,
            password: '',
            databaseName: currentUser?.databaseName || 'CrystalCopier',
            assignedScreens: exec.assignedScreens || [],
            employeeId: exec.employeeId,
          }));
          setExecutives(backendExecutives);
        }

        // Update current user if it's the logged-in executive
        setCurrentUser((prev) => {
          if (!prev || prev.role !== 'executive' || prev.executiveId !== executive.employeeId) {
            return prev;
          }
          return {
            ...prev,
            assignedScreens,
          };
        });
      } catch (error) {
        console.error('Error updating executive screen assignments:', error);
        throw error;
      }
    }
  }, [executives, currentUser]);

  const deleteExecutive = useCallback((id) => {
    setExecutives((prev) => prev.filter((exec) => exec.id !== id));
    setCurrentUser((prev) => {
      if (prev?.role === 'executive' && prev.executiveId === id) {
        return null;
      }
      return prev;
    });
  }, []);

  const refreshExecutives = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'supervisor') {
      return;
    }

    try {
      const executivesResponse = await apiCall(API_ENDPOINTS.GET_ALL_EXECUTIVES_WITH_SCREENS);
      if (executivesResponse.success && executivesResponse.data) {
        // Map backend data to frontend format
        const backendExecutives = executivesResponse.data.map((exec) => ({
          id: `exec-${exec.employeeId}`,
          name: exec.employeeName || exec.username,
          username: exec.username,
          password: '', // Don't store password in frontend
          databaseName: currentUser.databaseName || 'CrystalCopier',
          assignedScreens: exec.assignedScreens || [],
          employeeId: exec.employeeId,
        }));
        setExecutives(backendExecutives);
        console.log(`✅ Refreshed ${backendExecutives.length} executives from backend`);
      }
    } catch (error) {
      console.warn('⚠️ Could not refresh executives from backend:', error.message);
    }
  }, [currentUser]);

  const hasAccessToScreen = useCallback(
    (routeName) => {
      if (!currentUser) return false;
      
      // Supervisors have access to all screens
      if (currentUser.role === 'supervisor') {
        return true;
      }
      
      // Executives only have access to assigned screens
      if (currentUser.role !== 'executive') {
        console.warn(`⚠️ Unknown role: ${currentUser.role} for user: ${currentUser.username}`);
        return false;
      }
      
      const hasAccess = currentUser.assignedScreens?.includes(routeName) || false;
      if (!hasAccess) {
        console.log(`🚫 Executive ${currentUser.username} does NOT have access to: ${routeName}`);
        console.log(`   Assigned screens: ${JSON.stringify(currentUser.assignedScreens)}`);
      }
      return hasAccess;
    },
    [currentUser]
  );

  const getAccessibleScreens = useCallback(() => {
    if (!currentUser) {
      console.warn(`⚠️ getAccessibleScreens: No currentUser`);
      return [];
    }
    
    // Validate role
    if (currentUser.role !== 'supervisor' && currentUser.role !== 'executive') {
      console.error(`❌ Invalid role: ${currentUser.role} for user: ${currentUser.username}`);
      return [];
    }
    
    if (currentUser.role === 'supervisor') {
      // Supervisors can access all screens
      const supervisorScreens = getSupervisorScreens();
      console.log(`✅ Supervisor ${currentUser.username} - returning all ${supervisorScreens.length} screens`);
      return supervisorScreens;
    }
    
    // For executives, ONLY return assigned screens - never all screens
    if (currentUser.role !== 'executive') {
      console.error(`❌ Expected executive role but got: ${currentUser.role}`);
      return [];
    }
    
    const screens = currentUser.assignedScreens;
    if (!screens || !Array.isArray(screens) || screens.length === 0) {
      // If no screens assigned, return empty array (not default screens)
      console.warn(`⚠️ Executive ${currentUser.username} has no assigned screens - returning empty array`);
      return [];
    }
    const sanitized = sanitizeScreens(screens);
    console.log(`✅ Executive ${currentUser.username} - returning ${sanitized.length} assigned screens:`, sanitized);
    return sanitized;
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
      refreshExecutives,
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
      refreshExecutives,
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


