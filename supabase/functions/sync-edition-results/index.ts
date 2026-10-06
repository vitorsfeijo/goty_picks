import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSyncHandler } from './handler.ts';

Deno.serve(createSyncHandler({ env: (name) => Deno.env.get(name), createClient }));
