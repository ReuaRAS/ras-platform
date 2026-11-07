import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// بدون كاش تدريجي: يعمل على حساب Cloudflare دون تفعيل R2.
// بعد تفعيل R2 من اللوحة أضف:
//   import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
//   defineCloudflareConfig({ incrementalCache: r2IncrementalCache })
export default defineCloudflareConfig({});
