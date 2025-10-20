? authentication strategy for v1 launch

|| JWT tokens
  -> stateless architecture
    -> scales horizontally
    -> no server-side session storage
  -> revocation difficult ><[security vs simplicity] implementation complexity

|| session tokens + Redis
  -> instant revocation capability
  -> battle-tested approach
  -> server-side state required ><[scaling vs security] operational complexity
  -> additional infrastructure (Redis cluster)

* [decided(rationale: "security > scaling complexity for v1", on: "2025-10-15")] session tokens + Redis
  action: provision Redis cluster on AWS ElastiCache
  action: implement session middleware with 24hr TTL
