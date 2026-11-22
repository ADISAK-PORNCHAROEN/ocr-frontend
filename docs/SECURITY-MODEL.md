# Security model

Status: the frontend security boundary and local backend integration have been
reviewed on `develop`. OCR Playground remains a local-first demo, not a public
multi-user service.

## Boundaries and data

- The browser sends selected document bytes to a Next.js BFF. The BFF forwards
  them to the separate OCR backend. Both boundaries receive untrusted data.
- Documents, page images, OCR text, job identifiers, and edits may be sensitive.
  The backend owns temporary job data. The browser keeps edits in memory, so a
  refresh or close loses them.
- The backend validates file signatures, extensions, decoded content, size,
  page count, dimensions, and pixel counts. It rejects encrypted PDFs and
  expires temporary jobs.
- Starting again or ending a job requests deletion. A failed DELETE or closed
  browser cannot guarantee immediate cleanup, so backend expiry is the fallback.
- The BFF uses route and method allow-lists, validates job and page path
  segments, checks the configured origin before mutations, drops browser
  credentials, disables caching, and bounds upstream wait time.
- React renders OCR text as text and edits it in a textarea. The frontend does
  not interpret OCR content as HTML.

## Controls and verification

| Concern | Control | Evidence |
| --- | --- | --- |
| Upload and forwarding | The BFF forwards only documented routes and methods. It streams multipart uploads and binary images without caching. | Playwright checks route, method, origin rejection, multipart forwarding and binary responses using the fixture. The live BFF forwarded a synthetic PDF and PNG. The backend returned `415` for malformed PDF bytes, `422` for encrypted PDFs and page-limit overflow, and `413` above the 20 MiB upload limit. |
| Data lifetime | Drafts stay in browser memory. The backend deletes jobs or expires their temporary data. | Browser tests cover delete retry and expiry recovery. A live DELETE returned `204` and the next GET returned `404`. With a 60-second TTL, expiry returned `404` and removed all files from the isolated temporary directory. |
| Result integrity | Original OCR data stays separate from drafts. Job-keyed queries keep delayed results from an older job out of the current session. | Browser tests cover empty edits, export snapshots, and a delayed response after the user ends a job. |
| Error handling | The BFF maps connection and timeout failures to user-facing messages. It forwards documented backend responses without returning fetch exception text. | Fixture and browser tests cover network failures, timeouts, cancellation, failed DELETE, uncertain upload, and expiry. |
| Browser access | Mutation requests must match the configured application origin. | Playwright verified that a cross-origin mutation does not reach the fixture backend. |

Manual review found no confirmed exploitable issue in the reviewed local flow.
`pnpm audit --prod` reported no known production dependency vulnerabilities.
No fuzzing or dedicated security scanner was run. Selected upload checks used
[OWASP ASVS 5.0.0 V5.2.1 and V5.2.2](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/docs_en/OWASP_Application_Security_Verification_Standard_5.0.0_en.json)
and [OWASP WSTG v4.2 BUSL-08](https://wstg.owasp.org/v4.2/4-Web_Application_Security_Testing/10-Business_Logic_Testing/08-Test_Upload_of_Unexpected_File_Types/).
This review is not an ASVS compliance claim.

Known limits include no user authentication or authorization, one-process
in-memory backend state, no explicit backend request or inference timeout, and
no model artifact hash or signature verification. Model revision `v2.1.4` is a
mutable tag. Keep both apps on loopback. Public deployment, multiple users,
persistence, or remote access needs a new review of access control, resource
abuse, retention, and deployment boundaries.
