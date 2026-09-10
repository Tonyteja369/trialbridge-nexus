# Reliable genomic data and accessible authentication media

## Goal
Make live genomic research retrieval resilient and transparent, allow users to export the exact current run, and prevent unnecessary sign-in video playback for users or devices requesting lower resource use.

## What will change
- Add bounded retry handling for transient public-API failures while never substituting synthetic records.
- Cache each public source independently with a short freshness window; expired cache entries will not be served when a refresh fails.
- Return explicit source availability metadata and ensure failed sources render only a clear `SOURCE OFFLINE` state, never retained results from an earlier request.
- Add JSON and CSV export controls for the current NCBI run, including query, requested/retrieved/processed counts, bases, bytes, all measured timings, throughput, record IDs, and retrieval/export timestamps.
- Keep export controls unavailable until a successful live run exists.
- Use the uploaded poster as the sign-in fallback and stop video loading/playback when reduced-motion, data-saver, slow-network, or low-battery signals indicate constrained playback.

## Technical details
- Retry only retryable network/HTTP failures with brief capped backoff; validation and permanent client errors fail immediately.
- Use isolated server-side cache entries keyed by source and normalized query. Cache only successful validated responses and never return expired data as a fallback.
- Configure client queries to avoid automatic duplicate retries and suppress cached result rendering whenever the latest source request errors.
- Generate downloads entirely from the successful in-memory run shown on screen; no fabricated fields or hidden data will be added.
- Verify success, forced-failure behavior, both export formats, reduced-motion fallback, desktop/mobile layout, and browser console output.
