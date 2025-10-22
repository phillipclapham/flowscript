quantum computing viability for cryptography

  -> decoherence problem (primary challenge)
    -> environmental noise interference
      -> requires extreme isolation (millikelvin temperatures)
        ><[physics vs economics] cryogenic infrastructure cost ($10M+ per system)
    -> quantum error correction needed
      -> topological qubits approach
        -> Microsoft Azure Quantum bet
        -> still theoretical (no working prototype)
      -> surface codes approach
        -> Google Sycamore implementation
        -> 1000:1 physical-to-logical qubit ratio ><[efficiency vs reliability] error tolerance

  -> scaling challenges
    -> qubit connectivity limitations
      -> 2D grid topology (current hardware)
      -> limits algorithmic complexity
    -> refrigeration requirements don't scale linearly
      -> heat removal becomes exponential problem

  -> timeline implications
    -> NIST post-quantum cryptography standards (2024)
    -> quantum advantage for crypto breaking: 10-15 years (conservative estimate)
    -> migration window: 5-10 years to adopt PQC

thought: current action is PQC migration, not waiting for quantum computers
  -> hybrid classical-quantum systems likely intermediate step

~ thought: might quantum networking solve connectivity before computing scales?
  -> quantum internet enables distributed computation
  -> separate research track to monitor
