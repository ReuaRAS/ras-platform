import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

// كاش ISR على Cloudflare KV (الربط NEXT_INC_CACHE_KV في wrangler.jsonc).
// بدون كاش كان كل طلب يعيد التصيير ويستعلم Supabase من جديد (2–5 ثوانٍ للصفحة).
// إن أردت لاحقًا كاش R2 مع Durable Objects (tag cache + queue) بعد تفعيل R2:
//   import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
//   defineCloudflareConfig({ incrementalCache: r2IncrementalCache })
export default defineCloudflareConfig({ incrementalCache: kvIncrementalCache });
