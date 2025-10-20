# Test FlowScript File

This is a simple test file to validate CLI functionality.

## Problem Statement

? How do we test the FlowScript toolchain?

## Approach

thought: We need a minimal example that exercises core features

The solution:
  -> Write simple FlowScript
  -> Parse to IR JSON
  -> Validate with linter

[decided(rationale: "covers parse, lint, validate commands", on: "2025-10-20")]

## Next Steps

action: Run parse command
action: Run lint command
action: Run validate command

✓ CLI tools ready for Phase 4
