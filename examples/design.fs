? caching strategy for read-heavy API endpoints

|| client-side caching (browser cache headers)
  -> reduces server load significantly
  -> stale data risk for dynamic content ><[performance vs freshness] user experience
  -> no infrastructure cost

|| Redis cache layer
  -> centralized cache invalidation
  -> consistent across clients
  -> additional infrastructure + monitoring ><[cost vs control] operational complexity
  -> battle-tested pattern

|| hybrid CDN + Redis architecture
  -> CDN for static assets (low latency)
  -> Redis for dynamic data (consistent invalidation)
  -> best of both approaches ><[complexity vs performance] implementation effort
  -> geographic distribution (lower latency)
  -> expensive for cache misses ><[latency vs cost] budget constraints
  -> requires cache key strategy

* [decided(rationale: "hybrid approach: CDN for static assets, Redis for dynamic data", on: "2025-10-14")] hybrid CDN + Redis architecture

  action: configure CloudFront for /static/* routes
  action: implement Redis cache for user profile data (5min TTL)
  action: add cache hit/miss monitoring to Datadog

  ✓ [completed(on: "2025-10-15")] CloudFront configuration deployed
  ✓ [completed(on: "2025-10-16")] Redis cache layer implemented

  [blocked(reason: "Datadog trial expired, need license approval", since: "2025-10-16")]
    action: add cache hit/miss monitoring to Datadog

thought: cache stampede risk for high-traffic endpoints
  -> implement probabilistic early expiration
  -> add jitter to TTL (±10% randomization)
  action: update cache middleware with jitter logic

=> performance testing on staging
  => load testing with k6 (1000 RPS)
    -> 95th percentile latency: 45ms (target: <50ms) ✓
    -> cache hit rate: 87% (target: >80%) ✓
  => deploy to production with gradual rollout
