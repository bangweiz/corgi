import { useState, useMemo, useCallback } from 'react';
import { api } from '../services/api';

export function useEnvironments() {
  const [environments, setEnvironments] = useState([]);
  const [activeEnvId, setActiveEnvId] = useState('');

  const refreshEnvironments = useCallback(async () => {
    try {
      const envs = await api.getEnvironments();
      if (Array.isArray(envs)) {
        setEnvironments(envs);
        if (envs.length > 0) {
          setActiveEnvId((current) => current || envs[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load environments:', err);
    }
  }, []);

  const activeEnvVariables = useMemo(() => {
    const env = environments.find((e) => e.id === activeEnvId);
    return env && Array.isArray(env.variables) ? env.variables : [];
  }, [environments, activeEnvId]);

  const activeEnvName = useMemo(() => {
    const env = environments.find((e) => e.id === activeEnvId);
    return env ? env.name : 'No Environment';
  }, [environments, activeEnvId]);

  const handleSaveEnv = useCallback(async (env) => {
    try {
      await api.saveEnvironment(env);
      const envs = await api.getEnvironments();
      setEnvironments(envs);
    } catch (err) {
      alert(`Failed to save environment: ${err.message}`);
    }
  }, []);

  const handleCreateEnv = useCallback(async (newEnv) => {
    try {
      await api.saveEnvironment(newEnv);
      const envs = await api.getEnvironments();
      setEnvironments(envs);
      setActiveEnvId(newEnv.id);
    } catch (err) {
      alert(`Failed to create environment: ${err.message}`);
    }
  }, []);

  const handleDeleteEnv = useCallback(
    async (envId) => {
      try {
        await api.deleteEnvironment(envId);
        const envs = await api.getEnvironments();
        setEnvironments(envs);
        if (activeEnvId === envId) {
          setActiveEnvId(envs[0] ? envs[0].id : '');
        }
      } catch (err) {
        alert(`Failed to delete environment: ${err.message}`);
      }
    },
    [activeEnvId]
  );

  const handleDuplicateEnv = useCallback(
    async (envId) => {
      try {
        const sourceEnv = environments.find((e) => e.id === envId);
        if (!sourceEnv) return;

        const baseName = sourceEnv.name.replace(/\s*\(Copy\s*\d*\)$/i, '');
        const existingCopies = environments.filter((e) => e.name.startsWith(baseName));
        const copySuffix =
          existingCopies.length > 1 ? ` (Copy ${existingCopies.length})` : ' (Copy)';
        const newName = `${baseName}${copySuffix}`;
        const newId = `${sourceEnv.id.replace(/_copy.*$/, '')}_copy_${Date.now().toString(36)}`;

        const duplicatedEnv = {
          ...JSON.parse(JSON.stringify(sourceEnv)),
          id: newId,
          name: newName,
          updatedAt: new Date().toISOString()
        };

        const data = await api.saveEnvironment(duplicatedEnv);
        if (data.success) {
          const envs = await api.getEnvironments();
          setEnvironments(envs);
          setActiveEnvId(newId);
          return newId;
        }
      } catch (err) {
        alert(`Failed to duplicate environment: ${err.message}`);
      }
    },
    [environments]
  );

  const handleSetVariable = useCallback(
    async (envId, key, value) => {
      const targetEnv = environments.find((e) => e.id === envId);
      if (!targetEnv) return false;

      const updatedEnv = JSON.parse(JSON.stringify(targetEnv));
      const vars = updatedEnv.variables || [];
      const existingIdx = vars.findIndex((v) => v.key === key);

      if (existingIdx >= 0) {
        vars[existingIdx] = { ...vars[existingIdx], value: String(value), enabled: true };
      } else {
        vars.push({ key, value: String(value), enabled: true });
      }
      updatedEnv.variables = vars;
      updatedEnv.updatedAt = new Date().toISOString();

      try {
        await api.saveEnvironment(updatedEnv);
        const envs = await api.getEnvironments();
        setEnvironments(envs);
        return true;
      } catch (err) {
        alert(`Failed to save variable: ${err.message}`);
        return false;
      }
    },
    [environments]
  );

  return {
    environments,
    setEnvironments,
    activeEnvId,
    setActiveEnvId,
    activeEnvVariables,
    activeEnvName,
    refreshEnvironments,
    handleSaveEnv,
    handleCreateEnv,
    handleDeleteEnv,
    handleDuplicateEnv,
    handleSetVariable
  };
}
