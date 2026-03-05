import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

type EntityType = 'compliance' | 'task' | 'user' | 'store';

export function useAudit() {
  const log = useCallback(async (
    entityType: EntityType,
    entityId: string,
    action: string,
    userId: string,
    metadata?: Record<string, unknown>,
  ) => {
    const { error } = await supabase.from('audit_log').insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      user_id: userId,
      metadata: metadata ?? null,
    });
    if (error) console.error('Audit log error:', error);
  }, []);

  return { log };
}
