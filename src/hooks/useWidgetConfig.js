import { useState, useEffect } from 'react';
import { supabase } from '../supabase.js';

export function useWidgetConfig(operatorId) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!operatorId) {
      setError('No operator ID');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('widget_config')
          .select('*')
          .eq('user_id', operatorId)
          .eq('enabled', true)
          .maybeSingle();

        if (err) throw err;
        if (!data) throw new Error('Widget not found or disabled');

        setConfig(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [operatorId]);

  return { config, loading, error };
}
