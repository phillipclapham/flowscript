! timeout errors in production API (500ms+ response times)
  <- database connection pool exhausted (max 20 connections)
    <- connection.release() missing in error handlers
      <- copy-paste bug from legacy user_controller.js
        <- no connection pooling tests in CI

[blocked(reason: "need staging environment to validate fix", since: "2025-10-16")]

action: add connection.release() to all error handlers
action: audit all controllers for resource leaks
action: add connection pool monitoring (Prometheus)
++ action: write integration tests for connection pooling

thought: pattern detected across 3 controllers (user, order, payment)
  -> suggests systematic issue in codebase
  -> code review template should check resource cleanup
