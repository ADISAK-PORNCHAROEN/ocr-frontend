# Security model

Status: proposed model based on [frontend plan](frontend-plan.md); the Next.js shell exists, while OCR application controls and runtime verification are still in progress. The first version is for use on the owner's machine, not public deployment.

## Boundaries and data

- A browser sends user-selected document bytes to a Next.js BFF, which forwards them to the separate OCR backend. Both boundaries receive untrusted data.
- Documents, page images, OCR text, job identifiers and user edits may be sensitive. Intended ownership is backend temporary job data and browser-memory edits; browser close or refresh loses the latter.
- The backend is intended to validate file contents, size, page count and protected/corrupt PDFs and to remove expired temporary data. These controls and their limits are not implemented or verified here.
- Starting again or ending requests deletion, but a failed request or closed browser cannot guarantee it. Backend expiry cleanup is a required fallback to verify.

## Invariants and verification to implement

| Concern | Intended invariant | Verification scenario |
| --- | --- | --- |
| Upload and forwarding | Only the configured backend is targeted; multipart and binary forwarding preserve intended content without unnecessary retention. | Isolated fixture exercises unsupported/corrupt files, limits, forwarding, cancellation and timeout. |
| Data lifetime | Drafts stay in browser memory; temporary backend artifacts follow the confirmed deletion/expiry policy. | Restart, failed delete, tab close and expiration on isolated data. |
| Result integrity | OCR original data remains distinct from edits; stale job responses cannot overwrite a new session. | Switch jobs during delayed responses and inspect exports. |
| Error handling | Errors communicate recovery without exposing document contents or secrets. | Exercise backend failures and inspect responses and logs. |

No identity, authentication or authorization design has been established. If public deployment, multiple users, persistence or remote access is introduced, the owner must review access control, resource abuse, job identifier exposure, retention and deployment trust boundaries before release. Reporting and supported-version policy are not established; see [SECURITY.md](../SECURITY.md).
