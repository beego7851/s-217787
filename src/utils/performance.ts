import { supabase } from "@/integrations/supabase/client";

export const performanceMonitor = {
  measureQueryTime: async (queryName: string, queryFn: () => Promise<any>) => {
    const start = performance.now();
    try {
      const result = await queryFn();
      const duration = performance.now() - start;
      
      // Log performance metrics to Supabase
      await supabase.from('monitoring_logs').insert({
        event_type: 'api_latency',
        metric_name: queryName,
        metric_value: duration,
        details: {
          success: true,
          timestamp: new Date().toISOString()
        }
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      // Log error metrics
      await supabase.from('monitoring_logs').insert({
        event_type: 'error_rate',
        metric_name: queryName,
        metric_value: duration,
        details: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
      
      throw error;
    }
  },

  logResourceUsage: async () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      await supabase.from('monitoring_logs').insert({
        event_type: 'resource_usage',
        metric_name: 'memory_usage',
        metric_value: memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100,
        details: {
          total: memory.jsHeapSizeLimit,
          used: memory.usedJSHeapSize,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
};