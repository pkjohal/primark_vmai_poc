import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { VMTask, TaskStatus, CloseReason, NonComplianceType, Severity } from '../lib/types';

interface CreateTaskData {
  compliance_record_id: string;
  store_id: string;
  reported_by: string;
  non_compliance_type: NonComplianceType;
  severity: Severity;
  description?: string;
  flagged_photo_url?: string | null;
  guideline_image_url?: string | null;
}

export function useTasks(storeId: string | undefined) {
  const [tasks, setTasks] = useState<VMTask[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('vm_tasks')
      .select(`
        *,
        compliance_record:compliance_records(
          id, ean, orin_or_km, identifier_type, product_description, department, campaign,
          status, guideline_image_url, flagged_photo_url:photo_url
        ),
        assigned_user:users!vm_tasks_assigned_to_fkey(id, name, role),
        reporter:users!vm_tasks_reported_by_fkey(id, name, role)
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (error) { console.error(error); setLoading(false); return; }
    setTasks((data ?? []) as VMTask[]);
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Realtime subscription
  useEffect(() => {
    if (!storeId) return;
    const channel = supabase
      .channel(`vm_tasks_${storeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vm_tasks', filter: `store_id=eq.${storeId}` },
        () => { fetchTasks(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [storeId, fetchTasks]);

  const createTask = useCallback(async (data: CreateTaskData): Promise<VMTask | null> => {
    // Find the VM manager for this store
    const { data: vmManager } = await supabase
      .from('users')
      .select('id')
      .eq('store_id', data.store_id)
      .eq('role', 'vm_manager')
      .eq('is_active', true)
      .limit(1)
      .single();

    const assignedTo = vmManager?.id ?? data.reported_by;

    const { data: task, error } = await supabase
      .from('vm_tasks')
      .insert({ ...data, assigned_to: assignedTo })
      .select()
      .single();
    if (error) { console.error(error); return null; }
    return task as VMTask;
  }, []);

  const updateStatus = useCallback(async (
    id: string,
    status: TaskStatus,
    evidencePhotoUrl?: string,
  ): Promise<boolean> => {
    const update: Record<string, unknown> = { status };
    if (status === 'completed') {
      update.completed_at = new Date().toISOString();
      if (evidencePhotoUrl) update.evidence_photo_url = evidencePhotoUrl;
    }
    const { error } = await supabase.from('vm_tasks').update(update).eq('id', id);
    if (error) { console.error(error); return false; }
    return true;
  }, []);

  const closeTask = useCallback(async (id: string, reason: CloseReason): Promise<boolean> => {
    const { error } = await supabase
      .from('vm_tasks')
      .update({ status: 'closed', close_reason: reason })
      .eq('id', id);
    if (error) { console.error(error); return false; }
    return true;
  }, []);

  const getTask = useCallback(async (id: string): Promise<VMTask | null> => {
    const { data, error } = await supabase
      .from('vm_tasks')
      .select(`
        *,
        compliance_record:compliance_records(
          id, ean, orin_or_km, identifier_type, product_description, department, campaign,
          status, guideline_image_url, flagged_photo_url:photo_url
        ),
        assigned_user:users!vm_tasks_assigned_to_fkey(id, name, role),
        reporter:users!vm_tasks_reported_by_fkey(id, name, role)
      `)
      .eq('id', id)
      .single();
    if (error) { console.error(error); return null; }
    return data as VMTask;
  }, []);

  return { tasks, loading, fetchTasks, createTask, updateStatus, closeTask, getTask };
}
